-- Anonymize Enterprise AI case study (formerly "Ask Oracle in MyOracle")
-- Canonical content: scripts/enterprise-ai-assistant-payload.cjs
-- Apply live: APPLY=1 node scripts/apply-enterprise-ai-case-study.cjs
-- Preflight: backup row before running (see apply script)
-- Rollback: restore from backups/enterprise-ai-pre-anonymize-*.json

UPDATE public.projects
SET
  title = 'Enterprise AI Assistant for Internal Knowledge Work',
  description = 'RAG-powered assistant embedded in a global employee portal (confidential client work)',
  url = 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1400&q=85&auto=format&fit=crop',
  published = true,
  requires_password = false,
  password = '',
  project_type = 'product-design',
  case_study_content = $body$# Overview

*Confidential work.* This case study describes a RAG-powered enterprise AI assistant embedded in a global employee portal at a Fortune 500 software company. Product names, UI, and proprietary metrics are generalized to respect NDA. Process, decisions, and design rationale reflect the actual work.

I led UX for an internal knowledge assistant serving 100k+ employees: conversational search with citations, permission-aware retrieval, and interaction patterns designed to earn trust after earlier AI pilots failed.

---

# The challenge

* **The trust gap:** Employees defaulted to traditional search and support tickets because prior AI pilots felt inaccurate or unsourced.
* **Latency UX:** Long LLM retrieval cycles (up to ~45 seconds on early models) required meaningful loading patterns, not blank waits.
* **Data sovereignty:** Dozens of siloed internal sources with conflicting permission models had to resolve before answers surfaced.
* **Organizational fragmentation:** Multiple unsanctioned "shadow AI" tools needed consolidation into one approved experience.

---

# My role & impact

## Leadership

* Authored product vision and executive narrative that converted stakeholder skepticism into funded, cross-functional delivery.
* Defined UX governance for the employee portal AI ecosystem: search, home, and assistant patterns across touchpoints.
* Facilitated executive workshops to prioritize roadmap across competing internal interests.

## Design

* Established design vision grounded in business priorities, technical constraints, and user needs.
* Delivered production-ready specifications bridging LLM latency constraints and a responsive, trustworthy interface.
* Built high-fidelity prototypes simulating RAG behavior months before infrastructure was ready.
* Extended shared design system patterns for AI-specific components (citations, source panels, thread states).

## Research

* Orchestrated multi-region research (NA, EMEA, APAC, LATAM) to map cross-cultural mental models for enterprise AI adoption.
* Used LLM-assisted synthesis on qualitative data to accelerate strategy for multiple business divisions.
* Benchmarked model performance across enterprise LLM options for accuracy on internal knowledge tasks.

---

# Key decisions

## Embedded first, not standalone

Chose to integrate the assistant into the existing employee portal rather than launch a separate app. **Tradeoff:** Less visible 0→1 branding, but adoption hinged on meeting employees in an interface they already trusted.

## Citation-first answers

Prioritized source visibility and permission-scoped citations over fluent, chat-like prose. **Tradeoff:** Slightly denser responses, significantly higher trust in research and pilot feedback.

## Progressive loading during retrieval

Designed staged status updates and streaming metadata for long retrieval windows instead of static spinners. **Tradeoff:** More UI complexity, but users stayed engaged through 30–45 second cold starts.

## Search-to-assistant handoff

Architected a three-phase rollout: AI-augmented search, generative workflow exploration, then full RAG assistant with seamless drill-down from broad query to deep thread. **Tradeoff:** Longer path to vision, but each phase shipped value and reduced organizational risk.

---

# Research insights

## Employees wanted sanctioned tools

Staff wanted employer-approved AI with clear policy boundaries. Third-party tools were used cautiously, mostly for low-risk tasks with heavy prompt sanitization.

## Trust favored search over chat

For specialized internal knowledge, participants trusted verified search results more than conversational AI they could not source.

## Role-specific prompt libraries mattered

Lines of business needed templated prompts employees could customize for recurring tasks in HR, legal review, and sales prep.

## Restricted collections by audience

Legal, HR, and Sales required knowledge collections scoped to permission groups, not a single open corpus.

---

# The solution

Evolved from search augmentation to a full RAG and MCP-enabled assistant capable of cross-divisional workflows, unified inside the employee portal search ecosystem.

## Phase 1: AI-augmented search

Generative answers embedded in existing search with progressive loading during model cold start.

## Phase 2: Generative workflow exploration

Single input toggling between fact-finding (search) and creation (generation) within one conversational thread.

## Phase 3: Full-scale RAG assistant

Seamless handoff from search results into deep, cited research sessions once the relevant knowledge source was identified.
$body$,
  case_study_sidebars = $json${
  "impact": {
    "title": "Impact",
    "hidden": false,
    "content": "**Global launch:** Shipped to **100k+ employees** as the sanctioned internal AI entry point.\n\n**Platform scale:** Dozens of internal data sources and knowledge collections via RAG + MCP.\n\n**Engagement:** Meaningful lift in assistant engagement after unifying fragmented search experiences (exact metrics confidential).\n\n**Pattern library:** Defined reference AI UI patterns reused by specialized assistants across HR, Legal, and Sales."
  },
  "atGlance": {
    "title": "At a glance",
    "hidden": false,
    "content": "**Role:** Principal Product Designer (strategy, research, interface architecture)\n\n**Scope:** Enterprise employee portal and AI experiences\n\n**Stakeholders:** HR/comms, platform engineering, AI platform eng, security\n\n**Team:** Partnered with engineering leadership across Platform, Search, and AI teams\n\n**Platforms:** Web (desktop-first), responsive mobile\n\n**Timeline:** Discovery: 2 weeks → pilot: 3 months → GA: ~1 year\n\n**Constraints:** Enterprise security, data governance, hallucination risk, global workforce"
  }
}$json$::jsonb,
  case_study_images = '[]'::jsonb,
  flow_diagram_images = '[]'::jsonb,
  video_items = '[]'::jsonb,
  case_study_sections = '[]'::jsonb,
  project_images_position = NULL,
  flow_diagrams_position = NULL,
  videos_position = NULL,
  solution_cards_position = NULL,
  section_positions = '{"Overview": 0, "hideImpact": false, "hideAtAGlance": false, "__RESEARCH_COLUMNS__": 2}'::jsonb,
  updated_at = NOW()
WHERE id = 'f99464b0-e584-41ad-9cbf-48de1aaf3a9f'::uuid;
