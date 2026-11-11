// Case study content — edited from /admin. Keep valid JSON after the '=' sign.
window.CASE = {
  "slug": "enphase-reconnection",
  "short": "Enphase Reconnection",
  "client": "Enphase",
  "logo": "../assets/icons/enphase.svg",
  "eyebrow": "Energy · Mobile app",
  "title": "Network reconnection flow redesign",
  "summary": "Replacing an old, text-heavy manual with an intuitive step-by-step guide — reducing support costs while giving homeowners a smooth, self-serve reconnection experience.",
  "meta": {
    "role": "UX Designer · Individual project",
    "platform": "MyEnlighten app · iOS & Android",
    "timeline": "30 days · Jan 2021",
    "teamLabel": "Tools",
    "team": "Figma, After Effects, Lottie, Notion"
  },
  "cover": "cover.png",
  "snapshot": {
    "problem": "When homeowners changed Wi-Fi or ISPs, the Envoy gateway disconnected — and a long, text-heavy guide made reconnecting it frustrating.",
    "did": "Benchmarked smart-device reconnection flows, mapped the journey, and designed an **animated, step-by-step guided flow** with actionable buttons.",
    "outcome": "Support calls fell **71%** (245 → 72 a month), setup time dropped **63%**, and user confidence rose **26 points**."
  },
  "context": {
    "heading": "Keeping solar systems online",
    "body": [
      "Enphase Energy is a global energy technology company specialising in solar, storage and energy management. Its ecosystem of hardware, software and cloud monitoring — through the **MyEnlighten app** — gives homeowners real-time insight into system performance.",
      "The **Enphase Envoy** is the communications gateway that collects solar system performance data and sends it to MyEnlighten. This project redesigned the Envoy’s network reconnection process to create a seamless, self-serve experience for homeowners."
    ],
    "blocks": [
      {
        "type": "cards",
        "title": "What was wrong with the existing flow",
        "items": [
          {
            "title": "Lack of actionable steps",
            "body": "The screen gave more detail, but stayed text-heavy and unprioritised, with steps written as paragraphs rather than scannable instructions. Users could skim and miss critical steps, causing frustration or errors."
          },
          {
            "title": "Cognitive load & step complexity",
            "body": "Each step contained long sentences with lots of technical details, leading to repeated attempts or failed setup."
          }
        ]
      },
      {
        "type": "image",
        "file": "current-experience.png",
        "caption": "The existing reconnection screens.",
        "ratio": "16 / 9"
      }
    ]
  },
  "process": {
    "heading": "Project plan",
    "intro": "I divided the work into four phases. Although they appear in order, the team followed an alternative sequence during execution.",
    "steps": [
      {
        "name": "Discover",
        "items": [
          "Desk research",
          "Benchmark smart Wi-Fi reconnection flows",
          "Review support tickets"
        ]
      },
      {
        "name": "Define",
        "items": [
          "Frame the opportunity",
          "Identify best practices",
          "Clarify user needs",
          "Set success criteria"
        ]
      },
      {
        "name": "Develop",
        "items": [
          "Create user flows & wireframes",
          "Design a step-by-step guide"
        ]
      },
      {
        "name": "Deliver",
        "items": [
          "Finalise the solution",
          "Build a high-fidelity prototype"
        ]
      }
    ]
  },
  "research": {
    "heading": "Learning from support tickets and smart-home leaders",
    "intro": "A deep dive into support tickets revealed the real frustrations homeowners faced, and helped pinpoint exactly where the experience was breaking down.",
    "blocks": [
      {
        "type": "quotes",
        "title": "Support tickets review",
        "items": [
          "Hi, my Envoy stopped sending data after I changed my Wi-Fi password. The app keeps saying ‘disconnected’ and I can’t figure out ==how to reconnect it.==",
          "We recently switched internet providers. Everything else in the house works, but the Envoy hasn’t connected since. ==Is there an easy way to reset it?==",
          "I followed the setup manual but it’s too long and confusing. I just want to ==reconnect the device to my new network. Please help.==",
          "The app shows ‘No connection’ for the last 3 days. I tried rebooting the router and the Envoy, but nothing changed. ==What should I do next?=="
        ]
      },
      {
        "type": "cards",
        "title": "Benchmarking Wi-Fi reconnection flows",
        "items": [
          {
            "title": "Amazon Alexa",
            "logo": "alexa.png",
            "body": "A conversational, question-led flow: simple Yes/No prompts about device status, with illustrative visuals that simplify decisions."
          },
          {
            "title": "EzyCam",
            "logo": "ezycam.png",
            "body": "A short sequence — reset the device, enter the Wi-Fi password, scan a QR code — with one action per screen."
          },
          {
            "title": "Smart Life",
            "logo": "smart-life.png",
            "body": "Clear, icon-based instructions for reset actions, stepwise navigation with progress indicators, and simple visual feedback."
          }
        ]
      },
      {
        "type": "image",
        "file": "benchmark.png",
        "caption": "Common patterns across smart-device reconnection flows.",
        "ratio": "16 / 9"
      },
      {
        "type": "image",
        "file": "journey.png",
        "caption": "A simplified end-to-end journey to identify friction points and align the team on the intended experience.",
        "ratio": "4 / 5"
      }
    ]
  },
  "problem": {
    "statement": [
      "The",
      {
        "role": "what",
        "text": "Enphase Envoy often disconnects"
      },
      "when",
      {
        "role": "who",
        "text": "homeowners change Wi-Fi or ISPs"
      },
      ", and its long,",
      {
        "role": "how",
        "text": "text-heavy setup guide makes reconnection frustrating"
      },
      ". This",
      {
        "role": "why",
        "text": "drives support calls, installer visits and higher costs."
      },
      "A simple, guided setup is needed to help homeowners troubleshoot on their own."
    ]
  },
  "explorations": {
    "name": "Iterations",
    "heading": "Five rounds of iteration",
    "intro": "The flow went through five iterations of user flows and wireframes before the final design.",
    "blocks": [
      {
        "type": "image",
        "file": "iterations.png",
        "caption": "Iterations 1–5 of the reconnection flow.",
        "ratio": "16 / 9"
      }
    ]
  },
  "solution": {
    "heading": "A guided, visual reconnection flow",
    "decisions": [
      {
        "title": "Step-by-step, animated guidance",
        "body": "Step-by-step instructions with animated guides and actionable buttons help users resolve connectivity problems on their own.",
        "file": "final-steps.png",
        "callout": "Animated guides and actionable buttons replace paragraphs of instructions."
      },
      {
        "title": "A streamlined user journey",
        "body": "The updated flow eliminates confusion points, introduces guided pathways, and ensures users can restore their device without relying on long support articles.",
        "file": "final-journey.png",
        "callout": "Guided pathways remove the need for long support articles."
      }
    ]
  },
  "impact": {
    "heading": "Measurable improvements in experience and efficiency",
    "intro": "The redesigned connectivity flow delivered measurable improvements across user experience and operational efficiency.",
    "metrics": [
      {
        "value": "71%",
        "label": "Fewer reconnection support calls",
        "sub": "From 245 to just 72 calls per month"
      },
      {
        "value": "63%",
        "label": "Faster average setup time",
        "sub": "About 27 minutes saved per installation"
      },
      {
        "value": "+26",
        "label": "Points of user confidence",
        "sub": "With strong gains among installers and internal teams"
      }
    ]
  },
  "next": {
    "takeaway": "Replacing a long, text-heavy manual with a **simple, guided and visual flow** let homeowners troubleshoot on their own — improving the experience while **cutting support calls and installer effort**.",
    "steps": [
      {
        "title": "Extend the pattern",
        "body": "Bring the same guided, animated pattern to other Envoy troubleshooting flows."
      },
      {
        "title": "Confirm the gains hold",
        "body": "Keep monitoring reconnection support calls and setup time to confirm the improvements last."
      }
    ]
  }
};
