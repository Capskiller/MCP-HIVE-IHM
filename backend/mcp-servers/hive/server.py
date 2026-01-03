"""MCP Server for Hive Database.

Connects to a real Hive instance via PyHive.
"""

import asyncio
import json
import logging
import os
from typing import Any

from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Hive connection settings from environment
HIVE_HOST = os.getenv("HIVE_HOST", "192.168.1.146")
HIVE_PORT = int(os.getenv("HIVE_PORT", "10000"))
HIVE_DATABASE = os.getenv("HIVE_DATABASE", "regen_db")

# Create MCP server
server = Server("mcp-hive")


def get_hive_connection():
    """Create a connection to Hive."""
    from pyhive import hive
    return hive.connect(
        host=HIVE_HOST,
        port=HIVE_PORT,
        database=HIVE_DATABASE,
    )


@server.list_tools()
async def list_tools() -> list[Tool]:
    """List available Hive tools."""
    return [
        Tool(
            name="execute_query",
            description=(
                "Exécute une requête SQL HiveQL sur la base regen_db. "
                "Tables disponibles: operations (9954 projets de rénovation urbaine), "
                "engagements (16274 engagements financiers), qpv_insee (1609 quartiers prioritaires), "
                "dictionnaire. Utiliser pour analyses, agrégations, jointures. Max 1000 lignes."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "HiveQL SELECT query to execute",
                    },
                    "database": {
                        "type": "string",
                        "description": f"Database name (default: {HIVE_DATABASE})",
                        "default": HIVE_DATABASE,
                    },
                },
                "required": ["query"],
            },
        ),
        Tool(
            name="list_databases",
            description="Liste les bases de données Hive disponibles (regen_db par défaut).",
            inputSchema={"type": "object", "properties": {}},
        ),
        Tool(
            name="list_tables",
            description=(
                "Liste les tables dans une base de données. "
                "Tables principales: operations, engagements, qpv_insee, dictionnaire."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "database": {
                        "type": "string",
                        "description": "Database name",
                        "default": HIVE_DATABASE,
                    },
                },
            },
        ),
        Tool(
            name="get_table_schema",
            description=(
                "Affiche le schéma d'une table (colonnes et types). "
                "Utile pour comprendre la structure avant une requête."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "table": {
                        "type": "string",
                        "description": "Table name",
                    },
                    "database": {
                        "type": "string",
                        "description": "Database name",
                        "default": HIVE_DATABASE,
                    },
                },
                "required": ["table"],
            },
        ),
        Tool(
            name="get_sample_data",
            description=(
                "Affiche un échantillon de données d'une table (max 20 lignes). "
                "Utile pour voir le format des données avant une requête."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "table": {
                        "type": "string",
                        "description": "Table name",
                    },
                    "database": {
                        "type": "string",
                        "description": "Database name",
                        "default": HIVE_DATABASE,
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Number of rows (max 20)",
                        "default": 10,
                    },
                },
                "required": ["table"],
            },
        ),
    ]


def run_hive_query(query: str, database: str = None) -> list[dict]:
    """Execute a Hive query and return results."""
    conn = None
    cursor = None
    try:
        conn = get_hive_connection()
        cursor = conn.cursor()

        # Switch database if specified
        if database and database != HIVE_DATABASE:
            cursor.execute(f"USE {database}")

        cursor.execute(query)

        # Get column names
        columns = [desc[0] for desc in cursor.description] if cursor.description else []

        # Fetch results
        rows = cursor.fetchall()

        # Convert to list of dicts
        results = []
        for row in rows:
            results.append(dict(zip(columns, [str(v) if v is not None else None for v in row])))

        return results
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@server.call_tool()
async def call_tool(name: str, arguments: dict[str, Any]) -> list[TextContent]:
    """Execute a Hive tool."""
    logger.info(f"Tool called: {name} with args: {arguments}")

    try:
        if name == "execute_query":
            query = arguments.get("query", "")
            database = arguments.get("database", HIVE_DATABASE)

            # Clean query: remove trailing semicolons (Hive doesn't like them)
            query = query.strip().rstrip(';').strip()

            # Security: Only allow SELECT queries
            if not query.upper().startswith("SELECT"):
                return [TextContent(
                    type="text",
                    text=json.dumps({"error": "Only SELECT queries are allowed"}),
                )]

            # Add LIMIT if not present (but not if already has one)
            if "LIMIT" not in query.upper():
                query = f"{query} LIMIT 1000"

            results = await asyncio.to_thread(run_hive_query, query, database)
            return [TextContent(
                type="text",
                text=json.dumps({
                    "status": "success",
                    "rows": len(results),
                    "data": results[:1000],  # Max 1000 rows
                }),
            )]

        elif name == "list_databases":
            results = await asyncio.to_thread(run_hive_query, "SHOW DATABASES")
            databases = [row.get("database_name", row.get("databaseName", list(row.values())[0])) for row in results]
            return [TextContent(
                type="text",
                text=json.dumps(databases),
            )]

        elif name == "list_tables":
            database = arguments.get("database", HIVE_DATABASE)
            results = await asyncio.to_thread(run_hive_query, f"SHOW TABLES IN {database}")
            tables = [row.get("tab_name", row.get("tableName", list(row.values())[0])) for row in results]
            return [TextContent(
                type="text",
                text=json.dumps(tables),
            )]

        elif name == "get_table_schema":
            table = arguments.get("table", "")
            database = arguments.get("database", HIVE_DATABASE)
            results = await asyncio.to_thread(run_hive_query, f"DESCRIBE {database}.{table}")
            schema = [{"name": row.get("col_name", list(row.values())[0]),
                      "type": row.get("data_type", list(row.values())[1] if len(row) > 1 else "unknown")}
                     for row in results if row.get("col_name", list(row.values())[0])]
            return [TextContent(
                type="text",
                text=json.dumps(schema),
            )]

        elif name == "get_sample_data":
            table = arguments.get("table", "")
            database = arguments.get("database", HIVE_DATABASE)
            limit = min(arguments.get("limit", 10), 20)  # Max 20 rows

            results = await asyncio.to_thread(
                run_hive_query,
                f"SELECT * FROM {database}.{table} LIMIT {limit}"
            )

            if results:
                columns = list(results[0].keys())
                rows = [list(row.values()) for row in results]
                return [TextContent(
                    type="text",
                    text=json.dumps({"columns": columns, "rows": rows}),
                )]
            return [TextContent(
                type="text",
                text=json.dumps({"columns": [], "rows": []}),
            )]

        return [TextContent(type="text", text=f"Unknown tool: {name}")]

    except Exception as e:
        logger.error(f"Error executing {name}: {e}")
        return [TextContent(
            type="text",
            text=json.dumps({"error": str(e)}),
        )]


async def main():
    """Run the MCP server."""
    logger.info(f"Starting MCP Hive Server (connecting to {HIVE_HOST}:{HIVE_PORT})...")
    async with stdio_server() as (read_stream, write_stream):
        await server.run(read_stream, write_stream, server.create_initialization_options())


if __name__ == "__main__":
    asyncio.run(main())
