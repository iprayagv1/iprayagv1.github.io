// Locked chapters of a confidential case study — edited from /admin. The public page doesn't load this file.
window.CASE_LOCKED = {
  "cover": "cover.png",
  "context": {
    "heading": "Group orders don’t fit a single-restaurant cart",
    "body": [
      "Group gatherings — family events, work lunches or celebrations — often lead users to place orders from multiple restaurants. But Swiggy’s cart is designed to handle orders from only one restaurant at a time, which creates several challenges."
    ],
    "blocks": [
      {
        "type": "cards",
        "title": "Key challenges identified",
        "numbered": true,
        "items": [
          {
            "title": "Restaurant selection",
            "body": "Choosing a restaurant that satisfies everyone is cumbersome, leading to delays and frustration."
          },
          {
            "title": "Menu browsing",
            "body": "Browsing menus from several restaurants one by one is tedious and inefficient."
          },
          {
            "title": "Payment splitting",
            "body": "Splitting the bill is complex, often needing manual calculations and multiple transactions."
          },
          {
            "title": "Multiple delivery charges",
            "body": "Ordering from different restaurants adds a delivery fee each time, raising the overall cost."
          },
          {
            "title": "Delivery timing",
            "body": "Coordinating delivery times so all orders arrive together is hard, affecting the dining experience."
          }
        ]
      }
    ]
  },
  "research": {
    "heading": "Research & analysis",
    "intro": "To understand user needs and challenges, I conducted interviews focused on the difficulties users face while placing group food orders.",
    "blocks": [
      {
        "type": "text",
        "body": "**Usage scenarios** — group orders are frequently placed for family gatherings, office lunches, meals with roommates, outings with friends and celebrations."
      },
      {
        "type": "list",
        "title": "Users reported difficulties in",
        "items": [
          "Selecting restaurants that cater to different preferences",
          "Deciding on menu items when considering options from multiple restaurants",
          "Splitting bills among group members, leading to confusion and errors",
          "Managing delivery times to ensure all orders arrive simultaneously",
          "Handling multiple delivery charges, which can be cost-prohibitive"
        ]
      },
      {
        "type": "list",
        "title": "Users expressed a preference for",
        "items": [
          "Faster delivery, so food arrives fresh and hot",
          "Simplified payment splitting, without manual calculations",
          "A single delivery charge, even when ordering from multiple restaurants"
        ]
      },
      {
        "type": "text",
        "body": "**Personas** — the research insights were used to develop three personas, representing the key stakeholders who would benefit from the Group Cart feature."
      },
      {
        "type": "persona",
        "name": "Priya",
        "age": 28,
        "role": "Marketing executive · Metropolitan city",
        "photo": "persona-priya.png",
        "bio": "Priya enjoys dining out with friends and often hosts casual get-togethers. She values variety and convenience when ordering food, especially when her friends have different tastes.",
        "goals": [
          "Easily explore different restaurant menus and make selections together with friends",
          "Save time by avoiding multiple orders and separate payments",
          "Ensure everyone in the group can find something they like"
        ],
        "motivations": [
          "Enjoys trying new cuisines and sharing meals with friends",
          "Wants a hassle-free ordering experience without the stress of coordinating multiple deliveries",
          "Values cost-effectiveness, especially when dining out with a group"
        ],
        "frustrations": [
          "Dislikes the complexity of placing orders from multiple restaurants",
          "Finds it frustrating to deal with separate delivery fees for each restaurant",
          "Hates waiting for different deliveries to arrive at different times"
        ]
      },
      {
        "type": "persona",
        "name": "Zaira",
        "age": 30,
        "role": "Software engineer",
        "photo": "persona-zaira.png",
        "bio": "Zaira loves tech and convenience. She often orders food with her colleagues during late-night work sessions or casual hangouts, and prefers straightforward processes that save time.",
        "goals": [
          "Quickly add items from various restaurants into one cart while collaborating with colleagues",
          "Split bills easily based on what each person orders",
          "Ensure a synchronised delivery time to enjoy meals together"
        ],
        "motivations": [
          "Enjoys socialising with colleagues and values team bonding over food",
          "Prefers tech-driven solutions that simplify everyday tasks",
          "Likes to keep track of her spending and share costs fairly among friends"
        ],
        "frustrations": [
          "Finds it cumbersome to manage separate payments for each restaurant",
          "Dislikes inconsistent delivery times that disrupt meals",
          "Frustrated by apps that lack real-time collaboration features"
        ]
      },
      {
        "type": "persona",
        "name": "Anil",
        "age": 35,
        "role": "Delivery partner",
        "photo": "persona-anil.png",
        "bio": "Anil works with multiple food delivery platforms. He values efficiency and consistency in his work and enjoys engaging with customers during deliveries.",
        "goals": [
          "Streamline deliveries from multiple restaurants in one trip to save time and fuel",
          "Ensure timely delivery for group orders, enhancing customer satisfaction",
          "Receive fair compensation for consolidated delivery charges"
        ],
        "motivations": [
          "Enjoys providing excellent service and values positive customer feedback",
          "Wants to optimise his delivery routes to maximise efficiency",
          "Seeks to build a good rapport with local restaurants and customers"
        ],
        "frustrations": [
          "Finds it challenging to coordinate deliveries when orders come from multiple locations",
          "Dislikes separate deliveries that take more time and effort",
          "Frustrated by inconsistent delivery instructions or time windows from different restaurants"
        ]
      }
    ]
  },
  "problem": {
    "statement": [
      "When",
      {
        "role": "who",
        "text": "friends, families and colleagues order together"
      },
      ", they often want food from different places — but",
      {
        "role": "what",
        "text": "Swiggy’s cart only supports one restaurant at a time"
      },
      ". Choosing, browsing, paying and tracking",
      {
        "role": "how",
        "text": "turn into several separate orders"
      },
      ", so",
      {
        "role": "why",
        "text": "group ordering becomes slow, costly and frustrating."
      }
    ]
  },
  "explorations": {
    "name": "Ideation",
    "heading": "Feature listing, card sorting & task flow",
    "intro": "I listed the key features and used card sorting to prioritise the Group Cart functionality, then mapped the task flow to find issues before designing screens.",
    "blocks": [
      {
        "type": "image",
        "file": "card-sorting.png",
        "caption": "Feature listing and card sorting — must-have, good-to-have and nice-to-have.",
        "ratio": "16 / 9"
      },
      {
        "type": "story",
        "title": "Task flow — Priya, Zaira and colleagues order for their weekend hangout",
        "items": [
          {
            "title": "Discovery of the Group Cart",
            "body": "Priya opens the Swiggy app and finds the new Group Cart option."
          },
          {
            "title": "Creating the group cart",
            "body": "The app guides Priya through creating a new group cart in just a few taps, and she invites her friends."
          },
          {
            "title": "Collaborative browsing",
            "body": "Everyone explores menus from different restaurants without switching between them, and sees each other’s choices in real time. Zaira suggests a restaurant and the group votes on it."
          },
          {
            "title": "Individual orders & customisation",
            "body": "Each member places their own order in the group cart and customises it to their preferences and portion sizes."
          },
          {
            "title": "Payment splitting made easy",
            "body": "The group splits the bill equally, pays only for what each person ordered, or lets the host cover it."
          },
          {
            "title": "Coordinated delivery",
            "body": "Orders from all restaurants arrive together, with one consolidated delivery charge."
          }
        ]
      },
      {
        "type": "image",
        "file": "wireframes.png",
        "caption": "Wireframes for the group cart, payment and tracking flows.",
        "ratio": "16 / 9"
      }
    ]
  },
  "solution": {
    "heading": "Proposed solution: Group Cart",
    "intro": "A Group Cart lets users order from multiple restaurants seamlessly, with a focus on making group ordering feel effortless.",
    "decisions": [
      {
        "title": "Multi-restaurant selection",
        "body": "Users can add items from different restaurants into a single group cart, simplifying selection and accommodating diverse preferences.",
        "file": "final-cart.png",
        "callout": "One cart, many restaurants."
      },
      {
        "title": "Collaborative menu browsing",
        "body": "Group members can browse and add items from various menus at the same time, making selections together in real time.",
        "file": "final-browse.png",
        "callout": "Everyone sees each other’s picks in real time."
      },
      {
        "title": "Integrated payment splitting",
        "body": "Split the bill among group members based on their individual orders — or equally, or let the host pay — without manual calculations.",
        "file": "final-payment.png",
        "callout": "Split equally, pay for your own, or let the host cover it."
      },
      {
        "title": "One delivery, one charge",
        "body": "A consolidated delivery charge replaces separate fees per restaurant, and delivery times are coordinated so all orders arrive together.",
        "file": "final-tracking.png",
        "callout": "One consolidated delivery charge; orders arrive together."
      }
    ]
  },
  "impact": {
    "expected": true,
    "heading": "Expected impact",
    "intro": "As a concept, this project wasn’t shipped. These are the outcomes it was designed to drive:",
    "blocks": [
      {
        "type": "list",
        "items": [
          "Fewer separate orders and checkouts for a single group meal",
          "Lower cost for users through one consolidated delivery charge",
          "No manual bill calculations or multiple payment transactions",
          "All food arriving together, fresh and hot"
        ]
      }
    ]
  },
  "next": {
    "takeaway": "Group ordering breaks down when the product assumes **one restaurant per order**. Designing around the group — shared cart, shared browsing, split payment and one delivery — makes ordering together **feel as easy as ordering alone**.",
    "steps": [
      {
        "title": "Validate with users",
        "body": "Test the Group Cart flow through usability testing in real group-ordering situations."
      },
      {
        "title": "Test operational feasibility",
        "body": "Explore how restaurants and delivery partners would handle coordinated delivery timing."
      }
    ]
  }
};
