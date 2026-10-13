```
              ☦
     ╔═════════════════════════╗
     ║  GROOVE & TIMING        ║
     ║  Specifications         ║
     ╚═════════════════════════╝
```

# Groove & Timing System

Based on LSDj's groove system.

---

## Ticks

The **tick** is the smallest time unit in Datamoshpit.

At 125 BPM, there are **50 ticks per second**.
Higher BPM = faster ticks. Lower BPM = slower ticks.

Formula: `ticks_per_second = BPM * ticks_per_beat / 60`

Tables advance **one row per tick** (by default).
Phrases advance **one row per N ticks** (defined by groove).

---

## Grooves

A groove defines how many ticks each phrase step lasts.
It's a repeating pattern of tick counts.

### Default Groove (Groove 00)
```
Row 0: 06 ticks  |  50%
Row 1: 06 ticks  |  50%
```
Straight timing. Each step = 6 ticks. Two steps = 12 ticks = one "beat subdivision".

### Swing Example
```
Row 0: 08 ticks  |  62%
Row 1: 05 ticks  |  38%
```
Even steps last longer, odd steps shorter = swing feel.

### Triplet Example
```
Row 0: 04 ticks
Row 1: 04 ticks
Row 2: 04 ticks
```
Three steps per beat subdivision instead of two.

### Complex Groove Example
```
Row 0: 06 ticks
Row 1: 03 ticks
Row 2: 06 ticks
Row 3: 09 ticks
```
Creates a lopsided, syncopated rhythm.

---

## Groove Screen

- 16 groove slots (00-0F)
- Each groove has up to 16 rows
- Each row defines the tick count for that step (01-FF)
- **SWING** column: percentage display of the timing relationship
- Groove 00 is the default for all phrases
- Use the **G** command in phrases or tables to switch grooves

### Groove Assignment
- Each phrase uses Groove 00 by default
- The G command changes the groove for that channel
- Tables can also use the G command to change their own tick rate
- Different channels can run different grooves simultaneously

---

## Tempo

- BPM range: 40-295 (matching LSDj range)
- Settable in Project screen
- Changeable live with the **T** command
- Tap tempo: tap A button rhythmically in Project screen

---

## Timing Relationships

```
At 120 BPM, Groove 6/6:

1 tick    = 8.33ms
1 step    = 6 ticks = 50ms
1 phrase  = 16 steps = 96 ticks = 800ms
1 beat    = 2 steps = 12 ticks = 100ms
1 measure = 8 steps = 48 ticks = 400ms (in 4/4)
```

Tables run at tick speed (one row per tick), so table effects happen
6x faster than phrase steps at default groove. This is why tables are
so powerful for detailed sound shaping.
