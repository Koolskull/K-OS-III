# Datamoshpit - Original Vision Prompt
## Recorded: 2026-03-13

### Core Vision
An emulated operating system experience featuring a unique musical MIDI tracker app called **Datamoshpit**. Mobile-friendly, cross-platform, minimal storage, maximal output.

### Tech Stack
- TypeScript, Next.js, React
- Three.js (3D/WebGL rendering)
- Theatre.js (animation)
- JUCE (VST plugin compatibility, native bridge)
- Target: Web + iPad app + custom hardware (future)

### Inspirations
- **Little GP Tracker (LGPT)**: https://github.com/djdiskmachine/pspdev / littlegptracker.com
  - Archive docs: https://web.archive.org/web/20160306172104/http://wiki.littlegptracker.com/doku.php?id=lgpt:reference_manual
- **LSDJ**: https://littlesounddj.com/lsd/index.php
- **LSDJ HD**: https://tommitytom.co.uk/lsdjhd/ (modern expanded UI showing all windows at once)
- **PicoTracker**: https://github.com/xiphonics/ (LGPT spiritual successor)
- **Furnace Tracker**: Great sound engine (YM2612), UI could be more efficient
- **Deflemask**: YM2612 Yamaha FM synthesis
- **Polyend Tracker**: Hardware tracker (user owns one)

### Key Design Principles
1. **Maximalistic Minimalism** - Simple to understand, deep to master
2. Instrument playground as the FIRST screen (not intimidating hex grids)
3. Touch-friendly instrument creation with macro controllers
4. Table system with ticks and dual effect columns (from LSDJ/LGPT)
5. Custom base-16 number system: **Slimentologika** (from the Ancient Temple of the Green Slime)
6. No rounded corners, no anti-aliasing, no gradient buttons
7. CRT shaders, pixelated fonts, monochromatic text
8. VMI (Visual Machine Interface) style animated buttons
9. Illustrated borders and scrollbars
10. Extreme cross-platform compatibility

### Business/Community Elements
- **2kool Productions** - parent brand
- **Datamoshpit** - the software name
- Potential collaboration with Glitché iOS app creator (friend of user)
  - Possible: shared effects, discount for Glitché subscribers, bundled features
  - Need to define value proposition for collaboration
- Future: curriculum/school, physical learning location, merchandise, comic books, artwork, collectibles
- Custom hardware device planned

### Cultural Elements
- ASCII art of Jesus Christ, Orthodox Christian saints, and Knights Templars in file headers
- "Unnecessarily blessed" - every file gets commented ASCII art protection
- Formal yet encouraging tone in documentation
- README should tell the origin story, be accessible to young readers
- Educational focus - could be understood by a kid learning to read

### Sound Engine Goals
- Yamaha YM2612 FM synthesis style (as in Furnace/Deflemask)
- VST plugin hosting via JUCE
- Minimal data footprint, maximum sonic capability
- Instrument slots with save/load
- Fun, interactive sound design as the entry point

### Tracker Architecture (from LGPT/LSDJ model)
- Songs → Chains → Phrases → Tables
- Tables: subroutined loops counting ticks, two effect layers per tick
- Hexadecimal + Slimentologika notation
- Efficient keyboard shortcuts AND touch gestures
