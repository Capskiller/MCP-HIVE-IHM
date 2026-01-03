"""MCP Server for PDF Cotations (ESG Ratings).

Provides access to extra-financial rating sheets for engagements.
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

server = Server("mcp-cotations")

# ESG Criteria
ESG_CRITERIA = [
    "Gouvernance",
    "Impact Social",
    "Environnement",
    "Emploi Local",
    "Innovation",
    "Durabilite",
    "Accessibilite",
    "Mixite Sociale",
    "Transition Energetique",
    "Biodiversite",
]


def generate_mock_cotation(engagement_id: int) -> dict:
    """Generate mock ESG cotation data."""
    random.seed(engagement_id)  # Deterministic for same ID

    scores = {}
    for criterion in ESG_CRITERIA:
        score = random.randint(40, 100)
        scores[criterion] = {
            "score": score,
            "class": (
                "A" if score >= 80 else
                "B" if score >= 65 else
                "C" if score >= 50 else
                "D" if score >= 35 else
                "E"
            ),
        }

    global_score = sum(s["score"] for s in scores.values()) // len(scores)
    global_class = (
        "A" if global_score >= 80 else
        "B" if global_score >= 65 else
        "C" if global_score >= 50 else
        "D" if global_score >= 35 else
        "E"
    )

    return {
        "engagement_id": engagement_id,
        "global_score": global_score,
        "global_class": global_class,
        "criteria": scores,
        "recommendations": [
            "Ameliorer la gouvernance du projet",
            "Renforcer les mesures environnementales",
        ] if global_class in ["C", "D", "E"] else [],
        "date_evaluation": "2024-01-15",
    }


@server.list_tools()
async def list_tools() -> list[Tool]:
    """List available cotation tools."""
    return [
        Tool(
            name="get_cotation_pdf",
            description=(
                "Récupère la fiche de cotation PDF extra-financière ESG d'un engagement. "
                "Retourne les scores et classes (A-E) pour 10 critères : Gouvernance, "
                "Impact Social, Environnement, Emploi Local, Innovation, Durabilité, "
                "Accessibilité, Mixité Sociale, Transition Énergétique, Biodiversité. "
                "Utiliser quand l'utilisateur demande une cotation, notation, fiche PDF, "
                "évaluation ESG, ou note extra-financière. IDs valides: 1-1000."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "engagement_id": {
                        "type": "integer",
                        "description": "Engagement ID (1-1000)",
                        "minimum": 1,
                        "maximum": 1000,
                    },
                },
                "required": ["engagement_id"],
            },
        ),
        Tool(
            name="search_cotations",
            description=(
                "Recherche des fiches de cotation ESG par classe (A-E) ou plage de scores. "
                "Permet de trouver les engagements avec les meilleures ou pires notations "
                "extra-financières. Utiliser pour lister, filtrer ou comparer les cotations."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "min_score": {
                        "type": "integer",
                        "description": "Minimum global score",
                        "default": 0,
                    },
                    "max_score": {
                        "type": "integer",
                        "description": "Maximum global score",
                        "default": 100,
                    },
                    "class_filter": {
                        "type": "string",
                        "description": "Filter by class (A, B, C, D, E)",
                        "enum": ["A", "B", "C", "D", "E"],
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Max results",
                        "default": 10,
                    },
                },
            },
        ),
    ]


@server.call_tool()
async def call_tool(name: str, arguments: dict[str, Any]) -> list[TextContent]:
    """Execute a cotation tool."""
    logger.info(f"Tool called: {name} with args: {arguments}")

    if name == "get_cotation_pdf":
        engagement_id = arguments.get("engagement_id", 1)
        if not 1 <= engagement_id <= 1000:
            return [
                TextContent(
                    type="text",
                    text=json.dumps({"error": "engagement_id must be between 1 and 1000"}),
                )
            ]

        await asyncio.sleep(0.3)  # Simulate PDF extraction
        cotation = generate_mock_cotation(engagement_id)
        return [TextContent(type="text", text=json.dumps(cotation, indent=2))]

    elif name == "search_cotations":
        min_score = arguments.get("min_score", 0)
        max_score = arguments.get("max_score", 100)
        class_filter = arguments.get("class_filter")
        limit = min(arguments.get("limit", 10), 20)

        results = []
        for i in range(1, 101):  # Search first 100
            cotation = generate_mock_cotation(i)
            if min_score <= cotation["global_score"] <= max_score:
                if class_filter is None or cotation["global_class"] == class_filter:
                    results.append({
                        "engagement_id": i,
                        "global_score": cotation["global_score"],
                        "global_class": cotation["global_class"],
                    })
                    if len(results) >= limit:
                        break

        return [TextContent(type="text", text=json.dumps(results, indent=2))]

    return [TextContent(type="text", text=f"Unknown tool: {name}")]


async def main():
    """Run the MCP server."""
    logger.info("Starting MCP Cotations Server...")
    async with stdio_server() as (read_stream, write_stream):
        await server.run(read_stream, write_stream, server.create_initialization_options())


if __name__ == "__main__":
    asyncio.run(main())
