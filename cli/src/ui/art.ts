/**
 * Aegis ASCII Art
 *
 * All visual assets live here. Pure data — no rendering logic.
 * Minimal, iconic, playful. Designed for 80-column terminals.
 *
 * These are not decoration. They give Aegis a physical presence
 * in the terminal — a character who walks into the room, thinks
 * visibly, and has a personality you can see.
 */

// ── Colors ─────────────────────────────────────────────────────────────

// We export raw strings. The terminal layer handles colorization.
// This keeps art.ts purely about shapes.

// ── Intro Logo ─────────────────────────────────────────────────────────

/**
 * Zeus holding the Aegis shield. Minimal, iconic, a little playful.
 * ~15 lines tall, centered for 80 columns.
 */
export const ZEUS_LOGO: string = `
                         ⚡
                        /|
                       / |
                  ____/  |
                 /       |
                |   ⚡   |
           _____|        |_____
          /     |   /\\   |     \\
         |  .----|  /  \\  |----.  |
         | |    | / ⛊  \\ |    | |
         |  '----|/______\\|----'  |
          \\_____/|        |\\_____/
                 |   ||   |
                 |   ||   |
                 |  /  \\  |
                 | /    \\ |
                 |/      \\|
                 /________\\

              A  E  G  I  S
`;

/**
 * Shield zoom-out sequence. Each frame is smaller than the last,
 * ending at a single icon that becomes the prompt origin.
 */
export const SHIELD_ZOOM_FRAMES: string[] = [
  // Frame 1 — medium shield
  `
           ___________
          /     ⚡     \\
         |    /    \\    |
         |   / ⛊    \\   |
         |  /________\\  |
          \\___________/
`,
  // Frame 2 — small shield
  `
            _______
           /  ⚡    \\
          |  / ⛊ \\  |
           \\_______/
`,
  // Frame 3 — tiny shield
  `
             /⚡\\
            |⛊ |
             \\_/
`,
  // Frame 4 — icon only
  `
              ⛊
`,
];

// ── Thinking Animations ────────────────────────────────────────────────

/**
 * Zeus throwing a lightning bolt.
 * Loops until Aegis is ready. The bolt goes out and comes back.
 * Each frame is the same height for clean redrawing.
 */
export const ZEUS_LIGHTNING_FRAMES: string[] = [
  // Frame 1 — winding up
  `
      \\O    
       |\\   
      / \\  ⚡
             
             
`,
  // Frame 2 — throwing
  `
      \\O/   
       |  ──⚡
      / \\     
              
              
`,
  // Frame 3 — bolt in flight
  `
      \\O    
       |\\        ⚡
      / \\          
                   
                   
`,
  // Frame 4 — bolt far out
  `
      \\O    
       |\\             ⚡
      / \\               
                        
                        
`,
  // Frame 5 — bolt returning
  `
      \\O    
       |\\        ⚡
      / \\          
                   
                   
`,
  // Frame 6 — caught
  `
     ⚡O    
       |\\   
      / \\  
            
            
`,
];

/**
 * Einstein walking across the terminal, glancing at the user.
 * Each frame shifts his position. Same height for clean redraw.
 * Plays left to right, then the sequence reverses.
 */
export const EINSTEIN_WALK_FRAMES: string[] = [
  // Frame 1
  `
  ~o/        
   /|        
   / \\    🤔 
             
`,
  // Frame 2
  `
     ~o/     
      /|     
      / \\  🤔
             
`,
  // Frame 3
  `
        ~o/  
         /|  
        / \\ 🤔
             
`,
  // Frame 4 — glances at user
  `
        \\o~  
         |\\  
        / \\ 👀
             
`,
  // Frame 5
  `
           \\o~
            |\\ 
           / \\
              
`,
  // Frame 6
  `
              \\o~
               |\\ 
              / \\
                 
`,
];

// ── Utilities ──────────────────────────────────────────────────────────

/** Height of the intro logo in lines (for cursor math) */
export const ZEUS_LOGO_HEIGHT = ZEUS_LOGO.split("\n").length;

/** Consistent frame height for thinking animations (for cursor math) */
export const THINKING_FRAME_HEIGHT = 6;

/** All thinking animations, for random selection */
export const THINKING_ANIMATIONS = [
  ZEUS_LIGHTNING_FRAMES,
  EINSTEIN_WALK_FRAMES,
];
