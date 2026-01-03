"""MCP Server for INSEE QPV Data.

Provides access to Priority Neighborhood (QPV) population data.
"""

import asyncio
import json
import logging
import random
from typing import Any

from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

server = Server("mcp-insee")

# Mock QPV data
REGIONS = [
    "Ile-de-France", "Auvergne-Rhone-Alpes", "Nouvelle-Aquitaine",
    "Occitanie", "Hauts-de-France", "Grand Est", "PACA",
]


def generate_mock_qpv(qpv_id: int) -> dict:
    """Generate mock QPV data."""
    random.seed(qpv_id)
    return {
        "code_qpv": f"QP0{qpv_id:05d}",
        "nom_qpv": f"Quartier {qpv_id}",
        "commune": f"Commune {qpv_id % 100}",
        "region": random.choice(REGIONS),
        "population_2024": random.randint(2000, 50000),
        "superficie_ha": random.randint(10, 500),
        "taux_pauvrete": round(random.uniform(25, 55), 1),
        "taux_chomage": round(random.uniform(15, 35), 1),
    }


@server.list_tools()
async def list_tools() -> list[Tool]:
    """List available INSEE tools."""
    return [
        Tool(
            name="get_qpv_info",
            description=(
                "Récupère les informations d'un Quartier Prioritaire de la Ville (QPV) par son code. "
                "Retourne: population, région, taux de pauvreté, taux de chômage, superficie. "
                "Données INSEE 2024. Exemple de code: QP075001."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "code_qpv": {
                        "type": "string",
                        "description": "QPV code (e.g., QP075001)",
                    },
                },
                "required": ["code_qpv"],
            },
        ),
        Tool(
            name="search_qpv_by_region",
            description=(
                "Recherche les QPV (Quartiers Prioritaires) par région. "
                "Régions disponibles: Ile-de-France, Auvergne-Rhône-Alpes, Nouvelle-Aquitaine, "
                "Occitanie, Hauts-de-France, Grand Est, PACA."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "region": {
                        "type": "string",
                        "description": "Region name",
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Max results",
                        "default": 10,
                    },
                },
                "required": ["region"],
            },
        ),
        Tool(
            name="get_qpv_statistics",
            description=(
                "Statistiques agrégées des QPV: nombre total, population totale, "
                "moyenne par quartier. Peut filtrer par région."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "region": {
                        "type": "string",
                        "description": "Filter by region (optional)",
                    },
                },
            },
        ),
    ]


@server.call_tool()
async def call_tool(name: str, arguments: dict[str, Any]) -> list[TextContent]:
    """Execute an INSEE tool."""
    logger.info(f"Tool called: {name} with args: {arguments}")

    if name == "get_qpv_info":
        code = arguments.get("code_qpv", "")
        # Extract numeric ID from code
        try:
            qpv_id = int(code.replace("QP", "").replace("0", "") or "1")
        except ValueError:
            qpv_id = 1

        await asyncio.sleep(0.2)
        qpv = generate_mock_qpv(qpv_id)
        qpv["code_qpv"] = code
        return [TextContent(type="text", text=json.dumps(qpv, indent=2))]

    elif name == "search_qpv_by_region":
        region = arguments.get("region", "")
        limit = min(arguments.get("limit", 10), 20)

        results = []
        for i in range(1, 200):
            qpv = generate_mock_qpv(i)
            if region.lower() in qpv["region"].lower():
                results.append(qpv)
                if len(results) >= limit:
                    break

        return [TextContent(type="text", text=json.dumps(results, indent=2))]

    elif name == "get_qpv_statistics":
        region_filter = arguments.get("region")

        # Generate aggregate stats
        total_pop = 0
        count = 0
        for i in range(1, 100):
            qpv = generate_mock_qpv(i)
            if region_filter is None or region_filter.lower() in qpv["region"].lower():
                total_pop += qpv["population_2024"]
                count += 1

        stats = {
            "total_qpv": count,
            "total_population": total_pop,
            "average_population": total_pop // count if count > 0 else 0,
            "region_filter": region_filter,
        }
        return [TextContent(type="text", text=json.dumps(stats, indent=2))]

    return [TextContent(type="text", text=f"Unknown tool: {name}")]


async def main():
    """Run the MCP server."""
    logger.info("Starting MCP INSEE Server...")
    async with stdio_server() as (read_stream, write_stream):
        await server.run(read_stream, write_stream, server.create_initialization_options())


if __name__ == "__main__":
    asyncio.run(main())
