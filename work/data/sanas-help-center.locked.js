// Locked chapters of a confidential case study — edited from /admin. The public page doesn't load this file.
window.CASE_LOCKED = {
  "cover": "cover.png",
  "context": {
    "heading": "From guided setup to ongoing self-service",
    "body": [
      "Sanas provides **real-time noise cancellation** for professionals working in high-stakes communication environments.",
      "As adoption grew, a key challenge emerged: **users struggled to successfully set up and use Noise Cancellation without external help**, leading to increased dependency on support.",
      "The team first improved early activation through a **Guided Portal Setup**. Building on that foundation, this project focused on the next phase — redesigning the Help Center to support ongoing self-service for setup guidance, feature usage and troubleshooting, so adoption could keep growing without growing support."
    ]
  },
  "process": {
    "heading": "A focused six-week UX delivery plan",
    "intro": "Discovery, design and delivery milestones aligned with external development and launch.",
    "steps": [
      {
        "name": "Analyse",
        "when": "Week 01 · Feb 17–21",
        "items": [
          "Support ticket analysis",
          "UX audit",
          "Competitor analysis"
        ]
      },
      {
        "name": "Define",
        "when": "Week 02 · Feb 24–28",
        "items": [
          "Define the problem",
          "Define platform constraints"
        ]
      },
      {
        "name": "Structure",
        "when": "Week 03 · Mar 3–7",
        "items": [
          "Design the IA",
          "UX & design guidelines"
        ]
      },
      {
        "name": "Design",
        "when": "Weeks 04–05 · Mar 10–21",
        "items": [
          "UX & design guidelines",
          "Review & iteration"
        ]
      },
      {
        "name": "Build",
        "when": "Week 06 · Mar 24–28",
        "items": [
          "Collaboration with development"
        ]
      },
      {
        "name": "Launch",
        "when": "Mar 31",
        "items": [
          "Final QA",
          "Public launch"
        ]
      }
    ]
  },
  "research": {
    "heading": "Support ticket analysis — a key input to real user friction",
    "blocks": [
      {
        "type": "list",
        "title": "What I analysed",
        "items": [
          "Repeated ticket categories over time",
          "Product areas generating the highest ticket volume",
          "Questions that could have been resolved through self-service"
        ]
      },
      {
        "type": "cards",
        "title": "Key findings",
        "items": [
          {
            "body": "A majority of tickets were related to **basic setup, usage and troubleshooting**, not advanced issues."
          },
          {
            "body": "Noise Cancellation **setup and audio issues** were the most common issues."
          },
          {
            "body": "Admins frequently asked about **portal configuration and user management**."
          },
          {
            "body": "Many tickets asked questions that were **already documented, but hard to find**."
          }
        ]
      },
      {
        "type": "cards",
        "title": "UX audit of the existing Help Center",
        "items": [
          {
            "title": "Disconnected experience"
          },
          {
            "title": "Search-first guidance lost"
          },
          {
            "title": "Weak information architecture"
          },
          {
            "title": "Product content mixed together"
          },
          {
            "title": "High-friction browsing"
          },
          {
            "title": "No content prioritisation"
          }
        ]
      },
      {
        "type": "image",
        "file": "ux-audit.png",
        "caption": "Annotated audit of the previous Help Center.",
        "ratio": "16 / 10"
      },
      {
        "type": "text",
        "body": "The Help Center was designed as a **documentation repository rather than a guided support experience**, resulting in poor discoverability, low confidence in self-service, and increased reliance on customer support."
      },
      {
        "type": "text",
        "body": "**Competitive benchmarking** — I compared Sanas against industry peers on structure, content, user feedback, navigation and visual design to find what works and where Sanas could stand out with clearer, faster, task-focused navigation."
      },
      {
        "type": "cards",
        "items": [
          {
            "title": "Krisp.ai",
            "logo": "krisp.png"
          },
          {
            "title": "IRIS Clarity",
            "logo": "iris-clarity.png"
          },
          {
            "title": "Tomato.ai",
            "logo": "tomato-ai.png"
          }
        ]
      },
      {
        "type": "image",
        "file": "benchmark.png",
        "caption": "Competitive benchmarking and what competitors taught us.",
        "ratio": "16 / 10"
      }
    ]
  },
  "problem": {
    "statement": [
      {
        "role": "who",
        "text": "Sanas admins and end users"
      },
      ", particularly during onboarding and troubleshooting of Noise Cancellation,",
      {
        "role": "what",
        "text": "lacked clear, task-based guidance"
      },
      ", resulting in",
      {
        "role": "how",
        "text": "repeated basic support tickets and slower setup completion"
      },
      ". This directly impacted feature adoption, increased support load, and",
      {
        "role": "why",
        "text": "weakened the overall product experience."
      }
    ]
  },
  "explorations": {
    "name": "Structure",
    "heading": "Reimagining the structure",
    "intro": "A simplified, scalable information architecture designed to make help content easier to find and navigate. The home page works as a navigation hub, not a documentation surface.",
    "blocks": [
      {
        "type": "list",
        "title": "Home page hierarchy",
        "items": [
          "Browse by operations — Get started, Manage & monitoring, Using Sanas, Troubleshooting",
          "Product guides, popular articles and “See all guides”",
          "FAQs and a clear Contact Support path",
          "Global header: What’s new, Help Center, link to Portal, Login, Search and Footer"
        ]
      },
      {
        "type": "image",
        "file": "ia.png",
        "caption": "Home, FAQ and Contact Support information architecture.",
        "ratio": "16 / 10"
      },
      {
        "type": "image",
        "file": "wireframes.png",
        "caption": "Wireframes for the home, category and article pages.",
        "ratio": "16 / 10"
      }
    ]
  },
  "solution": {
    "heading": "Final UI & implementation",
    "intro": "Final designs ensured visual consistency, clear hierarchy, and feasibility within the platform.",
    "decisions": [
      {
        "title": "Search as a core UI dependency",
        "body": "Search was treated as a core part of the UI, not a fallback. Before scaling content, search needed to reliably surface the right answers with minimal effort.",
        "file": "final-home.png",
        "callout": "Search — treated as a core UI dependency, not a fallback."
      },
      {
        "title": "Concise, scannable FAQs — with a clear way out",
        "body": "FAQs were designed as concise, scannable answers instead of long-form documentation. A clear escalation path was intentionally preserved for cases where self-service fails.",
        "file": "final-faq.png",
        "callout": "A clear escalation path, intentionally preserved for when self-service fails."
      },
      {
        "title": "Predictable navigation on category pages",
        "body": "Left-hand navigation stays visible across category and article pages, enabling predictable movement and easy backtracking. Information is broken into scannable content cards with clear labels, reducing cognitive load.",
        "file": "final-category.png",
        "callout": "Left-hand navigation stays visible, so users can backtrack without restarting."
      }
    ]
  },
  "impact": {
    "heading": "Outcome & impact summary",
    "intro": "The redesigned Help Center launched in March 2025. Within the first 2 months (Mar–Apr 2025), early indicators showed clear improvement in self-service engagement and content effectiveness.",
    "metrics": [
      {
        "value": "19k+",
        "label": "Article views",
        "sub": "Increased"
      },
      {
        "value": "49%",
        "label": "Read-through rate",
        "sub": "Increased"
      },
      {
        "value": "78%",
        "label": "Feedback responses",
        "sub": "Increased"
      },
      {
        "value": "30%",
        "label": "Basic FAQ tickets",
        "sub": "Reduced"
      }
    ],
    "blocks": [
      {
        "type": "image",
        "file": "impact-dashboard.png",
        "caption": "Help Center analytics after launch.",
        "ratio": "16 / 9"
      }
    ]
  },
  "next": {
    "takeaway": "Turning the Help Center from a documentation repository into a **guided, task-based support experience** helped reduce setup friction, improve self-service success, and **support long-term adoption** of Sanas’s core features.",
    "steps": [
      {
        "title": "Scale the content",
        "body": "Now that search reliably surfaces the right answers, scale the content library."
      },
      {
        "title": "Improve the weakest articles",
        "body": "Use article feedback (“Was this helpful?”) to find and rewrite the weakest articles."
      },
      {
        "title": "Find the next self-service gaps",
        "body": "Keep tracking basic-ticket volume to spot where self-service still falls short."
      }
    ]
  }
};
