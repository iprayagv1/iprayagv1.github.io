// Locked chapters of a confidential case study — edited from /admin. The public page doesn't load this file.
window.CASE_LOCKED = {
  "cover": "cover.png",
  "context": {
    "heading": "Real-time noise cancellation for enterprise teams",
    "body": [
      "Sanas provides real-time noise cancellation for professionals working in high-stakes communication environments.",
      "As adoption grew, team leads and IT managers were expected to set up and activate Sanas Noise Cancellation for themselves and their team — on their own, as quickly as possible. Many got stuck long before the product reached their users."
    ]
  },
  "process": {
    "heading": "The blueprint of how I un-trapped our users",
    "steps": [
      {
        "name": "Discover",
        "items": [
          "Onboarding funnel analysis",
          "Support ticket review"
        ]
      },
      {
        "name": "Define",
        "items": [
          "Journey mapping",
          "Problem framing"
        ]
      },
      {
        "name": "Ideate",
        "items": [
          "Solution exploration",
          "Flow concepts",
          "Copy clarity"
        ]
      },
      {
        "name": "Prototype & test",
        "items": [
          "Interactive flows",
          "Stakeholder reviews"
        ]
      },
      {
        "name": "Deliver",
        "items": [
          "Dev collaboration",
          "Feature rollout",
          "Metrics tracking"
        ]
      }
    ]
  },
  "research": {
    "heading": "Finding the “uh-oh” moment",
    "intro": "I started with the onboarding funnel to see where people dropped off, then reviewed support tickets to understand why.",
    "blocks": [
      {
        "type": "funnel",
        "title": "Onboarding funnel — before the redesign",
        "steps": [
          {
            "label": "Signup / login",
            "value": 100
          },
          {
            "label": "App download prompt",
            "value": 68
          },
          {
            "label": "Portal exploration",
            "value": 46
          },
          {
            "label": "App download attempt",
            "value": 31
          },
          {
            "label": "App activation attempt",
            "value": 24
          },
          {
            "label": "Successful activation",
            "value": 9
          }
        ],
        "note": "Only the brave survived: fewer than 1 in 10 users made it to a working setup."
      },
      {
        "type": "text",
        "body": "Most users did not fail because of lack of interest, but because the system required them to **self-discover a complex, technical setup** with no guidance. The absence of a clear onboarding path caused users to stall, make errors, or abandon setup entirely."
      },
      {
        "type": "cards",
        "title": "What the support tickets showed",
        "numbered": true,
        "items": [
          {
            "body": "Users were confused about **where to start** and what steps to follow."
          },
          {
            "body": "Setup was split across the portal and the Help Center, so **important information was spread out**."
          },
          {
            "body": "Setup felt technical and overwhelming, forcing many users to **rely on support for basic tasks**."
          }
        ]
      },
      {
        "type": "image",
        "file": "journey-map.png",
        "caption": "Journey mapping — a team lead / IT manager at a mid-size IT firm trying to set up Sanas for themselves and their team, across portal exploration, app download and activation.",
        "ratio": "16 / 9"
      }
    ]
  },
  "problem": {
    "statement": [
      {
        "role": "who",
        "text": "Admins, IT teams and individual users"
      },
      "often",
      {
        "role": "what",
        "text": "struggled to set up Sanas Noise Cancellation"
      },
      "because the process was",
      {
        "role": "how",
        "text": "confusing and technical"
      },
      ". Without clear guidance, rollout was slow, users got frustrated, and",
      {
        "role": "why",
        "text": "adoption of this core feature stayed low."
      }
    ]
  },
  "explorations": {
    "name": "Ideation",
    "heading": "Explored multiple directions to reduce activation friction",
    "intro": "Based on the journey mapping, funnel analysis and support ticket reviews, I explored solution directions for each pain point.",
    "blocks": [
      {
        "type": "table",
        "cols": [
          "Opportunity",
          "Pain point",
          "How?",
          "Solution"
        ],
        "rows": [
          [
            "Guided portal setup",
            "Users land in the Admin Portal with no guidance and don’t know what to do next.",
            "Guide users step by step instead of leaving them to explore.",
            "Introduce a progressive, step-by-step setup guide with progress tracking."
          ],
          [
            "Activation simplification",
            "Activation feels technical and confusing, leading to errors and drop-offs.",
            "Reduce choices and explain activation in plain language.",
            "Make auto-activation the recommended default and position manual keys as a fallback."
          ],
          [
            "Help Center improvements",
            "Users rely on support because Help Center content is hard to find and use.",
            "Improve content structure, navigation and search discoverability.",
            "Identified as a follow-up opportunity and planned for a subsequent sprint."
          ]
        ]
      }
    ]
  },
  "solution": {
    "heading": "A progressive, guided setup",
    "intro": "The final design replaced the fragmented onboarding with a progressive, guided setup flow that empowered admins to activate confidently, while still giving them the flexibility to explore the portal.",
    "decisions": [
      {
        "title": "Explained the ecosystem upfront",
        "body": "A short overview introduces Workspaces, the Admin Portal, Roles and the Desktop App before anything else, so admins understand how the pieces fit together.",
        "file": "ecosystem.png",
        "callout": "Clear explanation of Workspaces, the Admin Portal, Roles and the Desktop App."
      },
      {
        "title": "Created a seamless entry into setup",
        "body": "After the ecosystem overview, the Admin Portal reveals itself gradually while a Setup Guide expands from the bottom. Admins can follow the guided flow, or skip anytime to explore freely.",
        "file": "setup-entry.png",
        "callout": "The Setup Guide expands from the bottom — follow it, or skip anytime to explore."
      },
      {
        "title": "Structured 4-step journey with progress tracking",
        "body": "Broke the guide into four clear steps, each with a progress indicator and a checkmark once completed. Explained in plain language what “activation mode” means, with concise descriptions of Auto Activation vs UAK and their use cases.",
        "file": "setup-steps.png",
        "callout": "Turns a technical barrier into a simple checklist: admins know what to do, and why it matters."
      },
      {
        "title": "Removed technical ambiguity from activation",
        "body": "Admins can confidently select the activation method that fits their environment, without escalating questions to IT or support.",
        "file": "activation-mode.png",
        "callout": "Auto Activation is the recommended default; manual keys are the fallback."
      },
      {
        "title": "Simplified whitelisting URLs",
        "body": "Added copy-to-clipboard for each required URL, hover info icons explaining why each one is necessary, and a link to a Help Center article for deeper technical details.",
        "file": "whitelisting.png",
        "callout": "Copy-to-clipboard and hover info on every required URL."
      },
      {
        "title": "Removed bottlenecks in app deployment",
        "body": "A smooth install path for both individual users and IT teams. A skip option lets admins manage everything themselves at first and add roles later, when they’re ready.",
        "file": "deployment.png",
        "callout": "A skip option keeps first-time setup flexible — add roles later."
      }
    ]
  },
  "impact": {
    "heading": "9% active users? I took that personally",
    "metrics": [
      {
        "value": "65%",
        "trend": "up",
        "label": "Growth in total users",
        "sub": "275k → 454k"
      },
      {
        "value": "46%",
        "trend": "up",
        "label": "Growth in monthly engaged users",
        "sub": "98.7k → 144.3k"
      },
      {
        "value": "85%",
        "trend": "up",
        "label": "Activation success rate",
        "sub": "Up from 58%"
      },
      {
        "value": "40%",
        "trend": "down",
        "label": "Fewer onboarding-related support tickets"
      }
    ],
    "blocks": [
      {
        "type": "image",
        "file": "dashboard.png",
        "caption": "Proof from our analytics dashboard — Noise Cancellation growth report.",
        "ratio": "16 / 9"
      }
    ]
  },
  "next": {
    "takeaway": "The redesigned onboarding experience **delivered measurable results within months of launch**. By streamlining setup, clarifying activation modes and guiding admins through a structured first-time flow, we were able to **significantly improve both adoption and engagement**.",
    "steps": [
      {
        "title": "Help Center improvements",
        "body": "Users still leaned on support because Help Center content was hard to find. This was identified during ideation and planned for the next sprint — it became the [Help Center redesign](sanas-help-center.html)."
      }
    ]
  }
};
