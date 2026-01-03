# Journal des Echanges IA - MCP-HIVE-SmartHub

## Configuration Initiale

| Paramètre | Valeur |
|-----------|--------|
| Ollama URL | http://192.168.1.146:11434 (DGX Spark) |
| Hive URL | jdbc:hive2://192.168.1.146:10000 |
| Database | regen_db |
| Tables | operations, engagements, qpv_insee, dictionnaire |

---

## Session 1: Tests des Modèles

### Test 1: devstral-small-2 (24B) - Sans System Prompt

**Question**: "Quel est le montant total des engagements pour Action Coeur de Ville ?"

**Resultat**: ECHEC PARTIEL
- Le modele a invente des noms de colonnes (domain_intervention, amount)
- Requete SQL incorrecte
- Necessite plusieurs iterations pour corriger

**Remarque**: Sans system prompt, le modele devine les schemas au lieu de les explorer.

---

### Test 2: devstral (24B) - Sans System Prompt

**Question**: "Donne-moi le top 5 des domaines d'intervention avec le montant total des engagements"

**Resultat**: SUCCES APRES CORRECTION
- Tools utilises: list_tables, get_table_schema, execute_query (x3)
- Le modele a auto-corrige ses erreurs de noms de colonnes apres echecs
- Duree: 40s
- Tokens: prompt=15728, completion=478

**Requetes executees**:
1. `SELECT domaine, SUM(montant)...` - ECHEC (colonne inexistante)
2. `SELECT domaine_intervention, SUM(montant)...` - ECHEC (colonne inexistante)
3. `SELECT domaine_intervention, SUM(montant_engagement)...` - SUCCES

**Remarque**: Le modele apprend de ses erreurs mais c'est inefficace.

---

### Test 3: gpt-oss:120b (120B)

**Question**: Requete complexe avec RANK() OVER et SUM() OVER

**Resultat**: EXCELLENT
- Execution de window functions complexes
- Requetes SQL correctes du premier coup
- Meilleure comprehension du schema

**Remarque**: Modele plus puissant = meilleure inference de schema.

---

## Modification: Ajout du System Prompt

**Date**: 2025-12-29 23:27

**Fichier modifie**: `app/services/chat/orchestrator.py`

**System Prompt ajoute**:
```
Tu es un assistant expert en analyse de donnees connecte a une base Hive.

IMPORTANT - Methodologie de travail:
1. Tu ne connais PAS le schema des tables a l'avance
2. AVANT toute requete SQL, tu DOIS explorer le schema:
   - Utilise list_tables pour voir les tables disponibles
   - Utilise get_table_schema pour comprendre les colonnes d'une table
   - Utilise get_sample_data si tu as besoin de voir des exemples de valeurs
3. Tu construis tes requetes SQL UNIQUEMENT a partir des informations decouvertes
4. Tu utilises execute_query pour executer tes requetes HiveQL

Regles SQL Hive:
- Pas de point-virgule a la fin des requetes
- Utilise les noms de colonnes EXACTS decouverts via get_table_schema
- Limite toujours les resultats (LIMIT) pour eviter les surcharges

Tu reponds en francais de maniere claire et structuree.
```

**Raison du changement**: Forcer le modele a decouvrir le schema au lieu de le deviner.

---

### Test 4: devstral (24B) - Avec System Prompt

**Question**: "Quel est le montant total des engagements par domaine ? Top 5"

**Resultat**: SUCCES DIRECT
- Tools utilises (ordre):
  1. list_tables (470ms)
  2. get_table_schema (428ms)
  3. execute_query (2999ms)
- Duree totale: 35.4s
- Tokens: prompt=6014, completion=414

**Reponse**:
| Domaine d'intervention | Montant total engage |
|------------------------|---------------------|
| Amenagement foncier | 2,146,862,007.84 EUR |
| Education | 2,028,602,458.56 EUR |
| Agriculture | 2,013,755,457.70 EUR |
| Amenagement immobilier | 1,918,167,316.95 EUR |
| Energie | 1,909,289,476.75 EUR |

**Remarque**: AMELIORATION SIGNIFICATIVE - Le modele explore maintenant le schema avant d'executer.

---

### Test 5: devstral (24B) - Jointure complexe

**Question**: "Exécute cette requête: SELECT o.statut_operation, COUNT(DISTINCT o.id_operation)..."

**Resultat**: SUCCES
- Tool: execute_query (7575ms)
- Duree: 44.9s
- Jointure operations/engagements reussie

**Reponse**:
| Statut | Nb ops | Total engagements | Moyenne |
|--------|--------|-------------------|---------|
| En pre-vivier | 1668 | 8,526,341,689 EUR | 623,954 EUR |
| Cloturee | 1671 | 8,326,919,281 EUR | 615,213 EUR |
| Livree | 1625 | 8,277,145,147 EUR | 623,842 EUR |

---

### Test 6: devstral-2 (123B) - Avec System Prompt

**Question**: "Quel est le montant total des engagements par domaine ? Top 5"

**Resultat**: SUCCES
- Tools utilises (ordre):
  1. list_tables (512ms)
  2. get_table_schema (624ms)
  3. execute_query (5036ms)
- Duree totale: 177.2s (dont ~120s chargement initial VRAM)
- Tokens: prompt=5895, completion=336

**Reponse**:
1. Amenagement foncier: 2,146,862,007.84 EUR
2. Education: 2,028,602,458.56 EUR
3. Agriculture: 2,013,755,457.70 EUR
4. Amenagement immobilier: 1,918,167,316.95 EUR
5. Energie: 1,909,289,476.75 EUR

**Remarque**: Premier test apres installation. Temps eleve du au chargement en VRAM (88GB).
Le modele suit correctement le workflow de decouverte de schema.

---

## Modeles Installes sur DGX Spark

| Modele | Taille Disque | VRAM Utilisee | Context | Statut |
|--------|---------------|---------------|---------|--------|
| devstral-2:latest | 74.9 GB | 88.1 GB | 256K | Installe |
| gpt-oss:120b | 65.4 GB | - | - | Installe |
| llama3.1:70b | 42.5 GB | - | - | Installe |
| devstral-small-2:latest | 15.2 GB | 22.0 GB | 384K | Installe |
| devstral:latest | 14.3 GB | 23.8 GB | 128K | Installe |
| llama3.1:8b | 4.9 GB | - | - | Installe |

**Note VRAM**: DGX Spark = 128GB memoire unifiee.
Actuellement charges: devstral-2 (88GB) + devstral-small-2 (22GB) = 110GB

---

## Configuration MCP Server Hive

**Fichier**: `mcp-servers/hive/server.py`

**Tools exposes**:
- `execute_query`: Execute HiveQL SELECT (max 1000 lignes)
- `list_databases`: Liste les bases disponibles
- `list_tables`: Liste les tables d'une base
- `get_table_schema`: Schema d'une table (colonnes, types)
- `get_sample_data`: Echantillon de donnees (max 20 lignes)

**Modification importante**:
- Suppression des point-virgules en fin de requete (`query.strip().rstrip(';')`)
- Verification SELECT-only pour securite

---

## Conclusions Provisoires

1. **System Prompt essentiel**: Sans instructions explicites, les modeles devinent les schemas au lieu de les explorer.

2. **devstral vs devstral-small-2**: Performances similaires (meme 24B), mais contexte different (128K vs 384K).

3. **gpt-oss:120b**: Meilleur pour requetes complexes (window functions) mais plus lent.

4. **devstral-2 (123B)**: En cours de telechargement - a tester pour comparaison.

5. **Workflow optimal**: list_tables -> get_table_schema -> execute_query

---

## Observations de Performance

### Temps de Chargement VRAM

| Modele | Taille VRAM | Temps chargement |
|--------|-------------|------------------|
| devstral-2 | 88 GB | ~120s |
| devstral | 24 GB | ~30s |
| devstral-small-2 | 22 GB | ~25s |

### Impact du Swapping de Modeles

Quand on change de modele, Ollama doit:
1. Decharger le modele actuel de la VRAM
2. Charger le nouveau modele

Avec devstral-2 (88GB), ce processus prend 2-3 minutes.

**Recommandation**: Utiliser un seul modele par session pour eviter les temps de swap.

---

## Comparaison des Modeles Devstral

| Critere | devstral-small-2 | devstral | devstral-2 |
|---------|------------------|----------|------------|
| Parametres | 24B | 24B | 123B |
| Taille disque | 15.2 GB | 14.3 GB | 74.9 GB |
| VRAM utilisee | 22 GB | 24 GB | 88 GB |
| Context | 384K | 128K | 256K |
| Famille | mistral3 | llama | mistral3 |
| Quantization | Q4_K_M | Q4_K_M | Q4_K_M |
| Tool calling | Excellent | Bon | Excellent |
| Temps reponse | ~35s | ~35s | ~50s |

**Recommandations**:
- **Production**: devstral-small-2 (bon equilibre performance/contexte)
- **Requetes complexes**: devstral-2 (meilleure qualite)
- **Tests rapides**: devstral (leger, compatible llama)

---

## Problemes Rencontres

1. **Timeout Ollama**: Le DGX peut etre lent a repondre lors de lourdes charges
2. **Swapping VRAM**: Changer de modele prend du temps avec les gros modeles
3. **Schemas devines**: Sans system prompt, les modeles inventent les colonnes
4. **Semicolons Hive**: Hive rejette les requetes finissant par `;`

---

## Configuration Finale

### System Prompt (orchestrator.py)
Force le modele a:
1. Explorer le schema avant toute requete
2. Utiliser les noms de colonnes exacts
3. Limiter les resultats

### MCP Hive Server (server.py)
- Connexion reelle a Hive (192.168.1.146:10000)
- Suppression automatique des semicolons
- Verification SELECT-only pour securite

### Modeles Recommandes
- **devstral-small-2** pour usage general
- **devstral-2** pour analyses complexes

---

## Prochaines Etapes (Pour Demain)

### A Tester
1. [ ] Comparer devstral-2 vs gpt-oss:120b sur requetes window functions
2. [ ] Tester cotations PDF (get_cotation_pdf)
3. [ ] Tester INSEE QPV (get_qpv_info)
4. [ ] Benchmark temps de reponse modeles

### A Ameliorer
1. [ ] Ajouter cache pour schemas tables (eviter list_tables/get_table_schema a chaque requete)
2. [ ] Precharger un modele au demarrage
3. [ ] Ajouter timeout configurable pour Ollama

### Frontend (MCP-HIVE-IHM)
1. [ ] Implementer BottomDrawer avec timeline MCP
2. [ ] Afficher tokens par message
3. [ ] Selecteur de modeles

---

## Fichiers Modifies Cette Session

| Fichier | Modification |
|---------|--------------|
| `app/services/chat/orchestrator.py` | Ajout SYSTEM_PROMPT |
| `app/config.py` | URL DGX Spark Ollama |
| `mcp-servers/hive/server.py` | Connexion Hive reelle + strip semicolons |
| `requirements.txt` | pyhive, thrift, pure-sasl |
| `Dockerfile` | Build tools pour pyhive |
| `README.md` | Configuration DGX, modeles |
| `CLAUDE.md` | Nouveau fichier instructions |
| `echangeia.md` | Ce journal |

---

*Derniere mise a jour: 2025-12-30 00:00*
