/**
 * Aegis ASCII Art
 *
 * All visual assets live here. Pure data — no rendering logic.
 * Designed for 80-column terminals.
 *
 * These are not decoration. They give Aegis a physical presence
 * in the terminal — a character who walks into the room, thinks
 * visibly, and has a personality you can see.
 */

// ── Intro Logo ─────────────────────────────────────────────────────────

/**
 * Block letter AEGIS wordmark with tagline.
 * Clean, bold, unmistakable. ~8 lines tall, fits 80-column terminals.
 */
export const AEGIS_LOGO: string = [
  "",
  "     \u2588\u2588\u2588\u2588\u2588\u2557 \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557 \u2588\u2588\u2588\u2588\u2588\u2588\u2557 \u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557",
  "    \u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255D\u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255D \u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255D",
  "    \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2551\u2588\u2588\u2588\u2588\u2588\u2557  \u2588\u2588\u2551  \u2588\u2588\u2588\u2557\u2588\u2588\u2551\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557",
  "    \u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2551\u2588\u2588\u2554\u2550\u2550\u255D  \u2588\u2588\u2551   \u2588\u2588\u2551\u2588\u2588\u2551\u255A\u2550\u2550\u2550\u2550\u2588\u2588\u2551",
  "    \u2588\u2588\u2551  \u2588\u2588\u2551\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u255A\u2588\u2588\u2588\u2588\u2588\u2588\u2554\u255D\u2588\u2588\u2551\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2551",
  "    \u255A\u2550\u255D  \u255A\u2550\u255D\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u255D \u255A\u2550\u2550\u2550\u2550\u2550\u255D \u255A\u2550\u255D\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u255D",
  "    \u2500\u2500 governance for ai agents \u2500\u2500",
  "",
].join("\n");

/** Height of the intro logo in lines (for cursor math) */
export const AEGIS_LOGO_HEIGHT = AEGIS_LOGO.split("\n").length;

// ── Thinking Animation: Shield + Assembly ──────────────────────────────

/**
 * Shield with progress indicators on the left,
 * structural assembly of .agentpolicy/ on the right.
 *
 * Diamonds (\u25C7) represent pending work.
 * Filled diamonds (\u25C6) represent work in progress.
 * Checkmarks (\u2713) represent completed steps.
 *
 * The animation cycles through states showing Aegis
 * actively building the policy. 12 frames, loops cleanly.
 */
export const SHIELD_ASSEMBLY_FRAMES: string[] = [
  // Frame 1 — shield appears, empty
  [
    "       \u25B3          ",
    "      \u2571 \u2572         ",
    "     \u2571   \u2572        ",
    "    \u2571  \u25C7  \u2572       ",
    "   \u2571  \u25C7 \u25C7  \u2572      ",
    "  \u2571  \u25C7 \u25C7 \u25C7  \u2572     ",
    " \u2571\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2572    ",
    "  \u2572         \u2571    ",
    "   \u2572       \u2571     ",
    "    \u2572     \u2571      ",
    "     \u2572   \u2571       ",
    "      \u2572 \u2571        ",
    "       V         ",
  ].join("\n"),

  // Frame 2 — scanning begins
  [
    "       \u25B3                                        ",
    "      \u2571 \u2572                                       ",
    "     \u2571   \u2572                                      ",
    "    \u2571  \u25C6  \u2572       scanning repo...              ",
    "   \u2571  \u25C7 \u25C7  \u2572                                    ",
    "  \u2571  \u25C7 \u25C7 \u25C7  \u2572                                   ",
    " \u2571\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2572                                  ",
    "  \u2572         \u2571                                   ",
    "   \u2572       \u2571                                    ",
    "    \u2572     \u2571                                     ",
    "     \u2572   \u2571                                      ",
    "      \u2572 \u2571                                       ",
    "       V                                        ",
  ].join("\n"),

  // Frame 3 — first item building
  [
    "       \u25B3                                        ",
    "      \u2571 \u2572                                       ",
    "     \u2571   \u2572        .agentpolicy/                 ",
    "    \u2571  \u25C6  \u2572       \u2502                              ",
    "   \u2571  \u25C7 \u25C7  \u2572      \u251C\u2500\u2500 constitution.json        ",
    "  \u2571  \u25C7 \u25C7 \u25C7  \u2572                                   ",
    " \u2571\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2572                                  ",
    "  \u2572         \u2571                                   ",
    "   \u2572       \u2571                                    ",
    "    \u2572     \u2571                                     ",
    "     \u2572   \u2571                                      ",
    "      \u2572 \u2571                                       ",
    "       V                                        ",
  ].join("\n"),

  // Frame 4 — constitution done, governance building
  [
    "       \u25B3                                        ",
    "      \u2571 \u2572                                       ",
    "     \u2571   \u2572        .agentpolicy/                 ",
    "    \u2571  \u2713  \u2572       \u2502                              ",
    "   \u2571  \u25C6 \u25C7  \u2572      \u251C\u2500\u2500 constitution.json  \u2713     ",
    "  \u2571  \u25C7 \u25C7 \u25C7  \u2572     \u251C\u2500\u2500 governance.json          ",
    " \u2571\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2572                                  ",
    "  \u2572         \u2571                                   ",
    "   \u2572       \u2571                                    ",
    "    \u2572     \u2571                                     ",
    "     \u2572   \u2571                                      ",
    "      \u2572 \u2571                                       ",
    "       V                                        ",
  ].join("\n"),

  // Frame 5 — governance done, roles appearing
  [
    "       \u25B3                                        ",
    "      \u2571 \u2572                                       ",
    "     \u2571   \u2572        .agentpolicy/                 ",
    "    \u2571  \u2713  \u2572       \u2502                              ",
    "   \u2571  \u2713 \u25C6  \u2572      \u251C\u2500\u2500 constitution.json  \u2713     ",
    "  \u2571  \u25C7 \u25C7 \u25C7  \u2572     \u251C\u2500\u2500 governance.json    \u2713     ",
    " \u2571\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2572    \u251C\u2500\u2500 roles/                    ",
    "  \u2572         \u2571                                   ",
    "   \u2572       \u2571                                    ",
    "    \u2572     \u2571                                     ",
    "     \u2572   \u2571                                      ",
    "      \u2572 \u2571                                       ",
    "       V                                        ",
  ].join("\n"),

  // Frame 6 — roles expanding
  [
    "       \u25B3                                        ",
    "      \u2571 \u2572                                       ",
    "     \u2571   \u2572        .agentpolicy/                 ",
    "    \u2571  \u2713  \u2572       \u2502                              ",
    "   \u2571  \u2713 \u25C6  \u2572      \u251C\u2500\u2500 constitution.json  \u2713     ",
    "  \u2571  \u25C7 \u25C7 \u25C7  \u2572     \u251C\u2500\u2500 governance.json    \u2713     ",
    " \u2571\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2572    \u251C\u2500\u2500 roles/                    ",
    "  \u2572         \u2571    \u2502   \u251C\u2500\u2500 default.json          ",
    "   \u2572       \u2571     \u2502   \u251C\u2500\u2500 frontend.json         ",
    "    \u2572     \u2571                                     ",
    "     \u2572   \u2571                                      ",
    "      \u2572 \u2571                                       ",
    "       V                                        ",
  ].join("\n"),

  // Frame 7 — more roles
  [
    "       \u25B3                                        ",
    "      \u2571 \u2572                                       ",
    "     \u2571   \u2572        .agentpolicy/                 ",
    "    \u2571  \u2713  \u2572       \u2502                              ",
    "   \u2571  \u2713 \u25C6  \u2572      \u251C\u2500\u2500 constitution.json  \u2713     ",
    "  \u2571  \u25C6 \u25C7 \u25C7  \u2572     \u251C\u2500\u2500 governance.json    \u2713     ",
    " \u2571\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2572    \u251C\u2500\u2500 roles/                    ",
    "  \u2572         \u2571    \u2502   \u251C\u2500\u2500 default.json    \u2713     ",
    "   \u2572       \u2571     \u2502   \u251C\u2500\u2500 frontend.json   \u2713     ",
    "    \u2572     \u2571      \u2502   \u251C\u2500\u2500 backend.json          ",
    "     \u2572   \u2571       \u2502   \u2514\u2500\u2500 testing.json          ",
    "      \u2572 \u2571                                       ",
    "       V                                        ",
  ].join("\n"),

  // Frame 8 — roles complete, state appearing
  [
    "       \u25B3                                        ",
    "      \u2571 \u2572                                       ",
    "     \u2571   \u2572        .agentpolicy/                 ",
    "    \u2571  \u2713  \u2572       \u2502                              ",
    "   \u2571  \u2713 \u2713  \u2572      \u251C\u2500\u2500 constitution.json  \u2713     ",
    "  \u2571  \u25C6 \u25C7 \u25C7  \u2572     \u251C\u2500\u2500 governance.json    \u2713     ",
    " \u2571\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2572    \u251C\u2500\u2500 roles/                \u2713 ",
    "  \u2572         \u2571    \u2502   \u251C\u2500\u2500 default.json    \u2713     ",
    "   \u2572       \u2571     \u2502   \u251C\u2500\u2500 frontend.json   \u2713     ",
    "    \u2572     \u2571      \u2502   \u251C\u2500\u2500 backend.json    \u2713     ",
    "     \u2572   \u2571       \u2502   \u2514\u2500\u2500 testing.json    \u2713     ",
    "      \u2572 \u2571        \u2514\u2500\u2500 state/                    ",
    "       V                                        ",
  ].join("\n"),

  // Frame 9 — ledger building
  [
    "       \u25B3                                        ",
    "      \u2571 \u2572                                       ",
    "     \u2571   \u2572        .agentpolicy/                 ",
    "    \u2571  \u2713  \u2572       \u2502                              ",
    "   \u2571  \u2713 \u2713  \u2572      \u251C\u2500\u2500 constitution.json  \u2713     ",
    "  \u2571  \u2713 \u25C6 \u25C7  \u2572     \u251C\u2500\u2500 governance.json    \u2713     ",
    " \u2571\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2572    \u251C\u2500\u2500 roles/                \u2713 ",
    "  \u2572         \u2571    \u2502   \u251C\u2500\u2500 default.json    \u2713     ",
    "   \u2572       \u2571     \u2502   \u251C\u2500\u2500 frontend.json   \u2713     ",
    "    \u2572     \u2571      \u2502   \u251C\u2500\u2500 backend.json    \u2713     ",
    "     \u2572   \u2571       \u2502   \u2514\u2500\u2500 testing.json    \u2713     ",
    "      \u2572 \u2571        \u2514\u2500\u2500 state/                    ",
    "       V              \u2514\u2500\u2500 ledger.json          ",
  ].join("\n"),

  // Frame 10 — almost done
  [
    "       \u25B3                                        ",
    "      \u2571 \u2572                                       ",
    "     \u2571   \u2572        .agentpolicy/                 ",
    "    \u2571  \u2713  \u2572       \u2502                              ",
    "   \u2571  \u2713 \u2713  \u2572      \u251C\u2500\u2500 constitution.json  \u2713     ",
    "  \u2571  \u2713 \u2713 \u25C6  \u2572     \u251C\u2500\u2500 governance.json    \u2713     ",
    " \u2571\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2572    \u251C\u2500\u2500 roles/                \u2713 ",
    "  \u2572         \u2571    \u2502   \u251C\u2500\u2500 default.json    \u2713     ",
    "   \u2572       \u2571     \u2502   \u251C\u2500\u2500 frontend.json   \u2713     ",
    "    \u2572     \u2571      \u2502   \u251C\u2500\u2500 backend.json    \u2713     ",
    "     \u2572   \u2571       \u2502   \u2514\u2500\u2500 testing.json    \u2713     ",
    "      \u2572 \u2571        \u2514\u2500\u2500 state/                    ",
    "       V              \u2514\u2500\u2500 ledger.json    \u2713     ",
  ].join("\n"),

  // Frame 11 — all checkmarks, validating
  [
    "       \u25B3                                        ",
    "      \u2571 \u2572                                       ",
    "     \u2571   \u2572        .agentpolicy/                 ",
    "    \u2571  \u2713  \u2572       \u2502                              ",
    "   \u2571  \u2713 \u2713  \u2572      \u251C\u2500\u2500 constitution.json  \u2713     ",
    "  \u2571  \u2713 \u2713 \u2713  \u2572     \u251C\u2500\u2500 governance.json    \u2713     ",
    " \u2571\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2572    \u251C\u2500\u2500 roles/                \u2713 ",
    "  \u2572         \u2571    \u2502   \u251C\u2500\u2500 default.json    \u2713     ",
    "   \u2572       \u2571     \u2502   \u251C\u2500\u2500 frontend.json   \u2713     ",
    "    \u2572     \u2571      \u2502   \u251C\u2500\u2500 backend.json    \u2713     ",
    "     \u2572   \u2571       \u2502   \u2514\u2500\u2500 testing.json    \u2713     ",
    "      \u2572 \u2571        \u2514\u2500\u2500 state/                    ",
    "       V              \u2514\u2500\u2500 ledger.json    \u2713     ",
  ].join("\n"),

  // Frame 12 — complete, clean
  [
    "       \u25B3                                        ",
    "      \u2571 \u2572                                       ",
    "     \u2571   \u2572        .agentpolicy/          ready  ",
    "    \u2571  \u2713  \u2572       \u2502                              ",
    "   \u2571  \u2713 \u2713  \u2572      \u251C\u2500\u2500 constitution.json  \u2713     ",
    "  \u2571  \u2713 \u2713 \u2713  \u2572     \u251C\u2500\u2500 governance.json    \u2713     ",
    " \u2571\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2572    \u251C\u2500\u2500 roles/                \u2713 ",
    "  \u2572         \u2571    \u2502   \u251C\u2500\u2500 default.json    \u2713     ",
    "   \u2572       \u2571     \u2502   \u251C\u2500\u2500 frontend.json   \u2713     ",
    "    \u2572     \u2571      \u2502   \u251C\u2500\u2500 backend.json    \u2713     ",
    "     \u2572   \u2571       \u2502   \u2514\u2500\u2500 testing.json    \u2713     ",
    "      \u2572 \u2571        \u2514\u2500\u2500 state/                    ",
    "       V              \u2514\u2500\u2500 ledger.json    \u2713     ",
  ].join("\n"),
];

// ── Thinking Animation: Minimal Shield Pulse ───────────────────────────

/**
 * A lighter animation for shorter waits or subsequent thinking pauses.
 * The shield breathes — diamonds cycle through states suggesting
 * ongoing work without the full assembly sequence.
 */
export const SHIELD_PULSE_FRAMES: string[] = [
  [
    "       \u25B3    ",
    "      \u2571 \u2572   ",
    "     \u2571   \u2572  ",
    "    \u2571  \u25C7  \u2572   thinking...",
    "   \u2571  \u25C7 \u25C7  \u2572",
    "  \u2571  \u25C7 \u25C7 \u25C7  \u2572",
    " \u2571\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2572",
    "  \u2572         \u2571",
    "   \u2572       \u2571",
    "    \u2572     \u2571",
    "     \u2572   \u2571",
    "      \u2572 \u2571",
    "       V  ",
  ].join("\n"),

  [
    "       \u25B3    ",
    "      \u2571 \u2572   ",
    "     \u2571   \u2572  ",
    "    \u2571  \u25C6  \u2572   thinking...",
    "   \u2571  \u25C7 \u25C7  \u2572",
    "  \u2571  \u25C7 \u25C7 \u25C7  \u2572",
    " \u2571\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2572",
    "  \u2572         \u2571",
    "   \u2572       \u2571",
    "    \u2572     \u2571",
    "     \u2572   \u2571",
    "      \u2572 \u2571",
    "       V  ",
  ].join("\n"),

  [
    "       \u25B3    ",
    "      \u2571 \u2572   ",
    "     \u2571   \u2572  ",
    "    \u2571  \u25C6  \u2572   thinking...",
    "   \u2571  \u25C6 \u25C7  \u2572",
    "  \u2571  \u25C7 \u25C7 \u25C7  \u2572",
    " \u2571\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2572",
    "  \u2572         \u2571",
    "   \u2572       \u2571",
    "    \u2572     \u2571",
    "     \u2572   \u2571",
    "      \u2572 \u2571",
    "       V  ",
  ].join("\n"),

  [
    "       \u25B3    ",
    "      \u2571 \u2572   ",
    "     \u2571   \u2572  ",
    "    \u2571  \u25C6  \u2572   thinking...",
    "   \u2571  \u25C6 \u25C6  \u2572",
    "  \u2571  \u25C7 \u25C7 \u25C7  \u2572",
    " \u2571\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2572",
    "  \u2572         \u2571",
    "   \u2572       \u2571",
    "    \u2572     \u2571",
    "     \u2572   \u2571",
    "      \u2572 \u2571",
    "       V  ",
  ].join("\n"),

  [
    "       \u25B3    ",
    "      \u2571 \u2572   ",
    "     \u2571   \u2572  ",
    "    \u2571  \u25C6  \u2572   thinking...",
    "   \u2571  \u25C6 \u25C6  \u2572",
    "  \u2571  \u25C6 \u25C7 \u25C7  \u2572",
    " \u2571\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2572",
    "  \u2572         \u2571",
    "   \u2572       \u2571",
    "    \u2572     \u2571",
    "     \u2572   \u2571",
    "      \u2572 \u2571",
    "       V  ",
  ].join("\n"),

  [
    "       \u25B3    ",
    "      \u2571 \u2572   ",
    "     \u2571   \u2572  ",
    "    \u2571  \u25C6  \u2572   thinking...",
    "   \u2571  \u25C6 \u25C6  \u2572",
    "  \u2571  \u25C6 \u25C6 \u25C7  \u2572",
    " \u2571\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2572",
    "  \u2572         \u2571",
    "   \u2572       \u2571",
    "    \u2572     \u2571",
    "     \u2572   \u2571",
    "      \u2572 \u2571",
    "       V  ",
  ].join("\n"),

  [
    "       \u25B3    ",
    "      \u2571 \u2572   ",
    "     \u2571   \u2572  ",
    "    \u2571  \u25C6  \u2572   thinking...",
    "   \u2571  \u25C6 \u25C6  \u2572",
    "  \u2571  \u25C6 \u25C6 \u25C6  \u2572",
    " \u2571\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2572",
    "  \u2572         \u2571",
    "   \u2572       \u2571",
    "    \u2572     \u2571",
    "     \u2572   \u2571",
    "      \u2572 \u2571",
    "       V  ",
  ].join("\n"),

  // Reset back to empty for loop
  [
    "       \u25B3    ",
    "      \u2571 \u2572   ",
    "     \u2571   \u2572  ",
    "    \u2571  \u25C7  \u2572   thinking...",
    "   \u2571  \u25C7 \u25C7  \u2572",
    "  \u2571  \u25C7 \u25C7 \u25C7  \u2572",
    " \u2571\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2572",
    "  \u2572         \u2571",
    "   \u2572       \u2571",
    "    \u2572     \u2571",
    "     \u2572   \u2571",
    "      \u2572 \u2571",
    "       V  ",
  ].join("\n"),
];

// ── Utilities ──────────────────────────────────────────────────────────

/** Consistent frame height for thinking animations (for cursor math) */
export const THINKING_FRAME_HEIGHT = 13;

/** All thinking animations, for random selection */
export const THINKING_ANIMATIONS = [
  SHIELD_ASSEMBLY_FRAMES,
  SHIELD_PULSE_FRAMES,
];