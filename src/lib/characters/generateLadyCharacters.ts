import sharp from "sharp";
import fs from "fs";
import path from "path";

const outDir = path.join(process.cwd(), "public", "characters");

/**
 * Generates 3D Pixar-styled character renders for the 3 comedy lady characters.
 */
export async function generateLadyCharacterRenders() {
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  console.log("🎨 Generating 3D stylized renders for comedy lady characters...");

  // 1. SERIAL SOUNDARYA
  // Purple silk saree, mega-serial shock expression, gold jhumkas, TV remote
  const soundaryaSvg = `
  <svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- Background studio gradient -->
      <radialGradient id="s_bg" cx="50%" cy="45%" r="65%">
        <stop offset="0%" stop-color="#2e1065" />
        <stop offset="60%" stop-color="#0f0728" />
        <stop offset="100%" stop-color="#030014" />
      </radialGradient>
      
      <!-- 3D Skin Gradient -->
      <radialGradient id="s_skin" cx="45%" cy="38%" r="55%" fx="40%" fy="30%">
        <stop offset="0%" stop-color="#ffdfba" />
        <stop offset="40%" stop-color="#f0b884" />
        <stop offset="85%" stop-color="#c97d46" />
        <stop offset="100%" stop-color="#9a5223" />
      </radialGradient>

      <!-- 3D Eye Iris -->
      <radialGradient id="s_iris" cx="40%" cy="35%" r="60%">
        <stop offset="0%" stop-color="#854d0e" />
        <stop offset="50%" stop-color="#451a03" />
        <stop offset="100%" stop-color="#000000" />
      </radialGradient>

      <!-- Purple Silk Saree Gradient -->
      <linearGradient id="s_saree" x1="20%" y1="0%" x2="80%" y2="100%">
        <stop offset="0%" stop-color="#c026d3" />
        <stop offset="35%" stop-color="#9333ea" />
        <stop offset="70%" stop-color="#6b21a8" />
        <stop offset="100%" stop-color="#3b0764" />
      </linearGradient>

      <!-- Gold Zari Border -->
      <linearGradient id="s_gold" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#fef08a" />
        <stop offset="50%" stop-color="#eab308" />
        <stop offset="100%" stop-color="#a16207" />
      </linearGradient>

      <!-- Hair 3D Gradient -->
      <radialGradient id="s_hair" cx="40%" cy="30%" r="60%">
        <stop offset="0%" stop-color="#374151" />
        <stop offset="30%" stop-color="#1f2937" />
        <stop offset="80%" stop-color="#030712" />
        <stop offset="100%" stop-color="#000000" />
      </radialGradient>

      <filter id="glow">
        <feGaussianBlur stdDeviation="6" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      <filter id="shadow">
        <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000000" flood-opacity="0.6" />
      </filter>
    </defs>

    <!-- Studio Backdrop -->
    <rect width="1024" height="1024" fill="url(#s_bg)" />

    <!-- Ambient Soap-Opera Dramatic Glow -->
    <circle cx="512" cy="420" r="320" fill="#a855f7" opacity="0.15" filter="url(#glow)" />

    <!-- Body / Saree Base -->
    <g filter="url(#shadow)">
      <!-- Shoulders & Blouse -->
      <path d="M 280 720 Q 380 640 512 640 Q 644 640 744 720 L 800 1024 L 224 1024 Z" fill="#701a75" />
      <!-- Saree Pallu drape -->
      <path d="M 320 720 Q 420 760 512 900 Q 560 980 600 1024 L 320 1024 Z" fill="url(#s_saree)" />
      <!-- Gold Zari Border on Pallu -->
      <path d="M 320 720 Q 420 760 512 900 Q 560 980 600 1024" stroke="url(#s_gold)" stroke-width="24" fill="none" />
      <path d="M 310 710 Q 410 750 502 890 Q 550 970 590 1014" stroke="#ffffff" stroke-width="4" stroke-dasharray="8 8" fill="none" opacity="0.8" />
    </g>

    <!-- Neck with 3D Shadow -->
    <rect x="460" y="520" width="104" height="130" rx="20" fill="url(#s_skin)" />
    <!-- Neck shadow from chin -->
    <path d="M 460 520 Q 512 550 564 520 L 564 560 Q 512 580 460 560 Z" fill="#7c2d12" opacity="0.4" />
    
    <!-- Traditional Gold Necklace -->
    <path d="M 430 620 Q 512 670 594 620" stroke="url(#s_gold)" stroke-width="16" fill="none" filter="url(#glow)" />
    <circle cx="512" cy="655" r="14" fill="url(#s_gold)" />
    <circle cx="512" cy="655" r="6" fill="#dc2626" />

    <!-- Head / Hair Back Layer -->
    <ellipse cx="512" cy="380" rx="230" ry="240" fill="url(#s_hair)" filter="url(#shadow)" />
    <!-- Traditional Hair Bun with Jasmine Flowers (Mallipoo) -->
    <ellipse cx="512" cy="190" rx="130" ry="90" fill="url(#s_hair)" />
    <path d="M 400 190 Q 512 120 624 190 Q 512 150 400 190 Z" fill="#ffffff" filter="url(#glow)" opacity="0.95" />
    <circle cx="430" cy="170" r="12" fill="#ffffff" />
    <circle cx="470" cy="155" r="13" fill="#ffffff" />
    <circle cx="512" cy="150" r="14" fill="#ffffff" />
    <circle cx="554" cy="155" r="13" fill="#ffffff" />
    <circle cx="594" cy="170" r="12" fill="#ffffff" />

    <!-- Head 3D Shape -->
    <ellipse cx="512" cy="390" rx="175" ry="195" fill="url(#s_skin)" filter="url(#shadow)" />

    <!-- Cute Cheeks / Blush -->
    <ellipse cx="400" cy="425" rx="36" ry="22" fill="#f43f5e" opacity="0.35" />
    <ellipse cx="624" cy="425" rx="36" ry="22" fill="#f43f5e" opacity="0.35" />

    <!-- Front Hair Bangs / Volume -->
    <path d="M 340 340 Q 420 220 512 250 Q 604 220 684 340 Q 612 280 512 290 Q 412 280 340 340 Z" fill="url(#s_hair)" />

    <!-- Bindi (Small Elegant Maroon Pottu) -->
    <circle cx="512" cy="305" r="9" fill="#991b1b" />
    <circle cx="512" cy="305" r="3" fill="#ffffff" opacity="0.6" />

    <!-- Theatrical Soap-Opera Arched Eyebrows (Shocked!) -->
    <path d="M 380 305 Q 430 260 480 310" stroke="#1f2937" stroke-width="9" stroke-linecap="round" fill="none" />
    <path d="M 544 310 Q 594 260 644 305" stroke="#1f2937" stroke-width="9" stroke-linecap="round" fill="none" />

    <!-- 3D Wide Expressive Eyes (Shocked!) -->
    <!-- Left Eye -->
    <ellipse cx="435" cy="355" rx="46" ry="42" fill="#ffffff" />
    <ellipse cx="435" cy="355" rx="27" ry="27" fill="url(#s_iris)" />
    <circle cx="435" cy="355" r="14" fill="#000000" />
    <circle cx="425" cy="345" r="9" fill="#ffffff" />
    <circle cx="445" cy="365" r="4" fill="#ffffff" />
    <!-- Left Eyelashes -->
    <path d="M 390 345 Q 435 315 480 345" stroke="#000000" stroke-width="7" fill="none" />

    <!-- Right Eye -->
    <ellipse cx="589" cy="355" rx="46" ry="42" fill="#ffffff" />
    <ellipse cx="589" cy="355" rx="27" ry="27" fill="url(#s_iris)" />
    <circle cx="589" cy="355" r="14" fill="#000000" />
    <circle cx="579" cy="345" r="9" fill="#ffffff" />
    <circle cx="599" cy="365" r="4" fill="#ffffff" />
    <!-- Right Eyelashes -->
    <path d="M 544 345 Q 589 315 634 345" stroke="#000000" stroke-width="7" fill="none" />

    <!-- 3D Nose -->
    <path d="M 512 360 Q 518 410 528 420 Q 512 430 496 420 Q 506 410 512 360 Z" fill="#b45309" opacity="0.5" />
    <ellipse cx="512" cy="422" rx="14" ry="7" fill="#c2410c" opacity="0.6" />

    <!-- Open Shocked Mouth (Gasp!) -->
    <ellipse cx="512" cy="475" rx="26" ry="32" fill="#450a0a" />
    <ellipse cx="512" cy="462" rx="18" ry="8" fill="#ffffff" /> <!-- Top teeth -->
    <path d="M 496 485 Q 512 495 528 485" fill="#f43f5e" /> <!-- Tongue -->
    <path d="M 480 475 Q 512 515 544 475" stroke="#e11d48" stroke-width="4" fill="none" />

    <!-- Gold Jhumka Earrings -->
    <!-- Left Jhumka -->
    <g transform="translate(325, 410)" filter="url(#glow)">
      <circle cx="0" cy="0" r="12" fill="url(#s_gold)" />
      <path d="M -18 15 Q 0 45 18 15 Z" fill="url(#s_gold)" />
      <circle cx="0" cy="50" r="5" fill="#dc2626" />
    </g>
    <!-- Right Jhumka -->
    <g transform="translate(699, 410)" filter="url(#glow)">
      <circle cx="0" cy="0" r="12" fill="url(#s_gold)" />
      <path d="M -18 15 Q 0 45 18 15 Z" fill="url(#s_gold)" />
      <circle cx="0" cy="50" r="5" fill="#dc2626" />
    </g>

    <!-- TV Remote Held in Hand (Right Side) -->
    <g transform="translate(720, 640) rotate(-25)" filter="url(#shadow)">
      <rect x="0" y="0" width="70" height="150" rx="16" fill="#1e293b" stroke="#475569" stroke-width="4" />
      <rect x="15" y="15" width="40" height="25" rx="6" fill="#ef4444" />
      <circle cx="35" cy="65" r="10" fill="#3b82f6" />
      <circle cx="20" cy="100" r="6" fill="#94a3b8" />
      <circle cx="35" cy="100" r="6" fill="#94a3b8" />
      <circle cx="50" cy="100" r="6" fill="#94a3b8" />
      <circle cx="20" cy="120" r="6" fill="#94a3b8" />
      <circle cx="35" cy="120" r="6" fill="#94a3b8" />
      <circle cx="50" cy="120" r="6" fill="#94a3b8" />
      <!-- Infrared Beam from Remote -->
      <polygon points="35,-30 15,0 55,0" fill="#facc15" opacity="0.8" filter="url(#glow)" />
    </g>

    <!-- Theatrical Drama Sparkles -->
    <text x="240" y="320" font-size="44" fill="#facc15" filter="url(#glow)">⚡</text>
    <text x="760" y="300" font-size="48" fill="#facc15" filter="url(#glow)">✨</text>
    <text x="500" y="110" font-size="36" fill="#ec4899" filter="url(#glow)">🌟</text>
  </svg>`;

  // 2. KOLAARU KOKILA
  // Parrot green saree, oversized glasses on head, huge handbag, live gossip broadcaster smirk
  const kokilaSvg = `
  <svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="k_bg" cx="50%" cy="45%" r="65%">
        <stop offset="0%" stop-color="#064e3b" />
        <stop offset="60%" stop-color="#022c22" />
        <stop offset="100%" stop-color="#01140e" />
      </radialGradient>
      <radialGradient id="k_skin" cx="45%" cy="38%" r="55%" fx="40%" fy="30%">
        <stop offset="0%" stop-color="#fed7aa" />
        <stop offset="40%" stop-color="#fb923c" />
        <stop offset="85%" stop-color="#c2410c" />
        <stop offset="100%" stop-color="#7c2d12" />
      </radialGradient>
      <radialGradient id="k_iris" cx="40%" cy="35%" r="60%">
        <stop offset="0%" stop-color="#b45309" />
        <stop offset="50%" stop-color="#451a03" />
        <stop offset="100%" stop-color="#000000" />
      </radialGradient>
      <linearGradient id="k_saree" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#84cc16" />
        <stop offset="40%" stop-color="#16a34a" />
        <stop offset="80%" stop-color="#15803d" />
        <stop offset="100%" stop-color="#14532d" />
      </linearGradient>
      <linearGradient id="k_gold" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#fef08a" />
        <stop offset="50%" stop-color="#eab308" />
        <stop offset="100%" stop-color="#a16207" />
      </linearGradient>
      <radialGradient id="k_hair" cx="40%" cy="30%" r="60%">
        <stop offset="0%" stop-color="#374151" />
        <stop offset="35%" stop-color="#1f2937" />
        <stop offset="85%" stop-color="#030712" />
        <stop offset="100%" stop-color="#000000" />
      </radialGradient>
      <filter id="k_shadow">
        <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000000" flood-opacity="0.6" />
      </filter>
      <filter id="k_glow">
        <feGaussianBlur stdDeviation="6" result="blur" />
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>

    <rect width="1024" height="1024" fill="url(#k_bg)" />

    <!-- Body & Bright Green Saree -->
    <g filter="url(#k_shadow)">
      <path d="M 280 720 Q 380 640 512 640 Q 644 640 744 720 L 800 1024 L 224 1024 Z" fill="#15803d" />
      <path d="M 320 720 Q 440 770 512 910 Q 570 980 620 1024 L 320 1024 Z" fill="url(#k_saree)" />
      <!-- Red Border on Saree -->
      <path d="M 320 720 Q 440 770 512 910 Q 570 980 620 1024" stroke="#dc2626" stroke-width="26" fill="none" />
      <path d="M 320 720 Q 440 770 512 910 Q 570 980 620 1024" stroke="url(#k_gold)" stroke-width="8" fill="none" />
    </g>

    <!-- Neck -->
    <rect x="460" y="520" width="104" height="130" rx="20" fill="url(#k_skin)" />
    <!-- Gold Chain with Mango Pendant -->
    <path d="M 430 620 Q 512 680 594 620" stroke="url(#k_gold)" stroke-width="14" fill="none" filter="url(#k_glow)" />
    <circle cx="512" cy="660" r="16" fill="url(#k_gold)" />
    <circle cx="512" cy="660" r="7" fill="#16a34a" />

    <!-- Hair Back -->
    <ellipse cx="512" cy="380" rx="230" ry="240" fill="url(#k_hair)" filter="url(#k_shadow)" />
    <!-- Head 3D Shape -->
    <ellipse cx="512" cy="390" rx="175" ry="195" fill="url(#k_skin)" filter="url(#k_shadow)" />

    <!-- Cheeks with Rosy Blush -->
    <ellipse cx="395" cy="430" rx="38" ry="24" fill="#fb7185" opacity="0.4" />
    <ellipse cx="629" cy="430" rx="38" ry="24" fill="#fb7185" opacity="0.4" />

    <!-- Front Hair Bangs -->
    <path d="M 340 330 Q 420 220 512 250 Q 604 220 684 330 Q 612 280 512 290 Q 412 280 340 330 Z" fill="url(#k_hair)" />

    <!-- Oversized Sunglasses Pushed Up on Forehead -->
    <g transform="translate(512, 230)" filter="url(#k_shadow)">
      <rect x="-140" y="-35" width="120" height="70" rx="24" fill="#18181b" stroke="#fbbf24" stroke-width="8" />
      <rect x="20" y="-35" width="120" height="70" rx="24" fill="#18181b" stroke="#fbbf24" stroke-width="8" />
      <line x1="-20" y1="0" x2="20" y2="0" stroke="#fbbf24" stroke-width="10" />
      <!-- Sunglasses Glare -->
      <line x1="-120" y1="-20" x2="-40" y2="20" stroke="#ffffff" stroke-width="6" opacity="0.6" stroke-linecap="round" />
      <line x1="40" y1="-20" x2="120" y2="20" stroke="#ffffff" stroke-width="6" opacity="0.6" stroke-linecap="round" />
    </g>

    <!-- Pottu -->
    <circle cx="512" cy="315" r="9" fill="#991b1b" />

    <!-- Knowing / Gossiping Eyebrows (One Raised!) -->
    <path d="M 380 315 Q 430 290 480 315" stroke="#1f2937" stroke-width="8" stroke-linecap="round" fill="none" />
    <path d="M 544 300 Q 594 250 644 285" stroke="#1f2937" stroke-width="8" stroke-linecap="round" fill="none" /> <!-- Raised eyebrow! -->

    <!-- Mischievous Eyes -->
    <ellipse cx="435" cy="360" rx="42" ry="38" fill="#ffffff" />
    <ellipse cx="442" cy="358" rx="24" ry="24" fill="url(#k_iris)" />
    <circle cx="444" cy="358" r="12" fill="#000000" />
    <circle cx="435" cy="350" r="8" fill="#ffffff" />

    <ellipse cx="589" cy="360" rx="42" ry="38" fill="#ffffff" />
    <ellipse cx="596" cy="358" rx="24" ry="24" fill="url(#k_iris)" />
    <circle cx="598" cy="358" r="12" fill="#000000" />
    <circle cx="589" cy="350" r="8" fill="#ffffff" />

    <!-- Eyeliner -->
    <path d="M 392 350 Q 435 330 480 350" stroke="#000000" stroke-width="6" fill="none" />
    <path d="M 546 350 Q 589 330 634 350" stroke="#000000" stroke-width="6" fill="none" />

    <!-- 3D Nose with Gold Stud (Mookkuthi) -->
    <path d="M 512 365 Q 518 415 528 425 Q 512 435 496 425 Q 506 415 512 365 Z" fill="#9a3412" opacity="0.5" />
    <circle cx="532" cy="420" r="5" fill="#facc15" filter="url(#k_glow)" /> <!-- Diamond Mookkuthi -->
    <circle cx="532" cy="420" r="2" fill="#ffffff" />

    <!-- Big Mischievous Gossip Smirk -->
    <path d="M 450 465 Q 520 520 584 460" stroke="#e11d48" stroke-width="8" fill="none" stroke-linecap="round" />
    <path d="M 465 470 Q 520 505 570 468" fill="#fda4af" /> <!-- Lipstick smile -->
    <!-- Dimples -->
    <circle cx="442" cy="465" r="4" fill="#c2410c" opacity="0.6" />
    <circle cx="592" cy="460" r="4" fill="#c2410c" opacity="0.6" />

    <!-- Massive Handbag (Gossip Bag) -->
    <g transform="translate(180, 720) rotate(10)" filter="url(#k_shadow)">
      <rect x="0" y="40" width="160" height="180" rx="24" fill="#ea580c" stroke="#facc15" stroke-width="8" />
      <path d="M 30 40 Q 80 -20 130 40" stroke="#facc15" stroke-width="12" fill="none" />
      <!-- Floral design on bag -->
      <circle cx="80" cy="120" r="28" fill="#fbbf24" opacity="0.9" />
      <circle cx="80" cy="120" r="14" fill="#b45309" />
      <!-- News sticking out of bag -->
      <rect x="30" y="10" width="60" height="40" rx="4" fill="#ffffff" transform="rotate(-15, 30, 10)" />
      <text x="35" y="32" font-size="12" font-weight="900" fill="#dc2626" transform="rotate(-15, 30, 10)">NEWS!</text>
    </g>

    <!-- Gossip Broadcast Antenna / Sound waves -->
    <text x="760" y="360" font-size="38" fill="#fbbf24" filter="url(#k_glow)">📻</text>
    <text x="790" y="320" font-size="28" fill="#a3e635" filter="url(#k_glow)">)))</text>
  </svg>`;

  // 3. POTTU PADMINI
  // Giant iconic maroon pottu, regal yellow/red Kanchipuram silk saree, area boss stance, mallipoo garland
  const padminiSvg = `
  <svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="p_bg" cx="50%" cy="45%" r="65%">
        <stop offset="0%" stop-color="#450a0a" />
        <stop offset="60%" stop-color="#260404" />
        <stop offset="100%" stop-color="#0f0000" />
      </radialGradient>
      <radialGradient id="p_skin" cx="45%" cy="38%" r="55%" fx="40%" fy="30%">
        <stop offset="0%" stop-color="#fed7aa" />
        <stop offset="40%" stop-color="#f97316" />
        <stop offset="85%" stop-color="#c2410c" />
        <stop offset="100%" stop-color="#7c2d12" />
      </radialGradient>
      <radialGradient id="p_iris" cx="40%" cy="35%" r="60%">
        <stop offset="0%" stop-color="#78350f" />
        <stop offset="50%" stop-color="#451a03" />
        <stop offset="100%" stop-color="#000000" />
      </radialGradient>
      <linearGradient id="p_saree" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#f59e0b" />
        <stop offset="40%" stop-color="#d97706" />
        <stop offset="80%" stop-color="#b45309" />
        <stop offset="100%" stop-color="#78350f" />
      </linearGradient>
      <linearGradient id="p_gold" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#fef08a" />
        <stop offset="50%" stop-color="#fbbf24" />
        <stop offset="100%" stop-color="#b45309" />
      </linearGradient>
      <radialGradient id="p_hair" cx="40%" cy="30%" r="60%">
        <stop offset="0%" stop-color="#27272a" />
        <stop offset="35%" stop-color="#18181b" />
        <stop offset="85%" stop-color="#09090b" />
        <stop offset="100%" stop-color="#000000" />
      </radialGradient>
      <filter id="p_shadow">
        <feDropShadow dx="0" dy="14" stdDeviation="18" flood-color="#000000" flood-opacity="0.7" />
      </filter>
      <filter id="p_glow">
        <feGaussianBlur stdDeviation="8" result="blur" />
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>

    <rect width="1024" height="1024" fill="url(#p_bg)" />

    <!-- Area Boss Royal Aura -->
    <circle cx="512" cy="400" r="340" fill="#f59e0b" opacity="0.12" filter="url(#p_glow)" />

    <!-- Body & Regal Mustard Saree with Maroon Zari -->
    <g filter="url(#p_shadow)">
      <path d="M 260 700 Q 380 630 512 630 Q 644 630 764 700 L 830 1024 L 194 1024 Z" fill="#991b1b" />
      <!-- Heavy Silk Saree Pleats -->
      <path d="M 300 700 Q 420 750 512 890 Q 580 970 630 1024 L 300 1024 Z" fill="url(#p_saree)" />
      <!-- Giant Temple Gold Border on Saree -->
      <path d="M 300 700 Q 420 750 512 890 Q 580 970 630 1024" stroke="url(#p_gold)" stroke-width="32" fill="none" />
      <path d="M 300 700 Q 420 750 512 890 Q 580 970 630 1024" stroke="#991b1b" stroke-width="12" fill="none" />
    </g>

    <!-- Strong Neck -->
    <rect x="455" y="510" width="114" height="140" rx="22" fill="url(#p_skin)" />
    <!-- Heavy Kasu Malai (Coin Necklace) -->
    <path d="M 420 610 Q 512 680 604 610" stroke="url(#p_gold)" stroke-width="20" fill="none" filter="url(#p_glow)" />
    <circle cx="450" cy="635" r="10" fill="url(#p_gold)" />
    <circle cx="480" cy="650" r="10" fill="url(#p_gold)" />
    <circle cx="512" cy="655" r="12" fill="url(#p_gold)" />
    <circle cx="544" cy="650" r="10" fill="url(#p_gold)" />
    <circle cx="574" cy="635" r="10" fill="url(#p_gold)" />

    <!-- Hair Back Volume & Large Bun -->
    <ellipse cx="512" cy="370" rx="240" ry="250" fill="url(#p_hair)" filter="url(#p_shadow)" />
    <ellipse cx="512" cy="180" rx="150" ry="100" fill="url(#p_hair)" />
    
    <!-- Dense Jasmine Flower (Mallipoo) Garland Wreath -->
    <path d="M 380 190 Q 512 110 644 190 Q 512 140 380 190 Z" fill="#ffffff" filter="url(#p_glow)" opacity="0.95" />
    <circle cx="410" cy="165" r="14" fill="#ffffff" />
    <circle cx="450" cy="145" r="15" fill="#ffffff" />
    <circle cx="490" cy="135" r="16" fill="#ffffff" />
    <circle cx="534" cy="135" r="16" fill="#ffffff" />
    <circle cx="574" cy="145" r="15" fill="#ffffff" />
    <circle cx="614" cy="165" r="14" fill="#ffffff" />

    <!-- Head 3D Shape -->
    <ellipse cx="512" cy="385" rx="180" ry="200" fill="url(#p_skin)" filter="url(#p_shadow)" />

    <!-- Subtle Regal Blush -->
    <ellipse cx="395" cy="425" rx="36" ry="20" fill="#e11d48" opacity="0.25" />
    <ellipse cx="629" cy="425" rx="36" ry="20" fill="#e11d48" opacity="0.25" />

    <!-- Hair Strands Front -->
    <path d="M 335 320 Q 420 220 512 245 Q 604 220 689 320 Q 612 270 512 280 Q 412 270 335 320 Z" fill="url(#p_hair)" />

    <!-- THE SIGNATURE GIANT POTTU (Forehead Bindi) -->
    <g filter="url(#p_glow)">
      <!-- Outer gold halo around pottu -->
      <circle cx="512" cy="295" r="26" fill="#facc15" opacity="0.4" />
      <!-- Giant Dark Maroon Velvet Pottu -->
      <circle cx="512" cy="295" r="22" fill="#7f1d1d" stroke="#facc15" stroke-width="2" />
      <circle cx="508" cy="291" r="5" fill="#ffffff" opacity="0.3" /> <!-- 3D light reflection -->
    </g>

    <!-- Boss Eyebrows (Commanding Respect) -->
    <path d="M 375 320 Q 430 285 480 320" stroke="#18181b" stroke-width="9" stroke-linecap="round" fill="none" />
    <path d="M 544 320 Q 594 285 649 320" stroke="#18181b" stroke-width="9" stroke-linecap="round" fill="none" />

    <!-- Sharp, Confident Area Boss Eyes -->
    <ellipse cx="435" cy="360" rx="44" ry="38" fill="#ffffff" />
    <ellipse cx="440" cy="360" rx="26" ry="26" fill="url(#p_iris)" />
    <circle cx="440" cy="360" r="13" fill="#000000" />
    <circle cx="432" cy="352" r="8" fill="#ffffff" />
    <path d="M 390 350 Q 435 330 480 350" stroke="#000000" stroke-width="7" fill="none" />

    <ellipse cx="589" cy="360" rx="44" ry="38" fill="#ffffff" />
    <ellipse cx="584" cy="360" rx="26" ry="26" fill="url(#p_iris)" />
    <circle cx="584" cy="360" r="13" fill="#000000" />
    <circle cx="576" cy="352" r="8" fill="#ffffff" />
    <path d="M 544 350 Q 589 330 634 350" stroke="#000000" stroke-width="7" fill="none" />

    <!-- 3D Nose with Ruby Ring Mookkuthi -->
    <path d="M 512 360 Q 518 412 530 422 Q 512 432 494 422 Q 506 412 512 360 Z" fill="#9a3412" opacity="0.5" />
    <circle cx="536" cy="418" r="6" fill="#e11d48" filter="url(#p_glow)" />
    <circle cx="536" cy="418" r="3" fill="#facc15" />

    <!-- Firm Motherly Boss Smile -->
    <path d="M 450 470 Q 512 510 574 470" stroke="#991b1b" stroke-width="8" fill="none" stroke-linecap="round" />
    <path d="M 460 472 Q 512 500 564 472" fill="#e11d48" /> <!-- Confident smile -->

    <!-- Giant Gold Jhumkas (Boss Earrings) -->
    <g transform="translate(320, 420)" filter="url(#p_glow)">
      <circle cx="0" cy="0" r="14" fill="url(#p_gold)" />
      <path d="M -22 18 Q 0 55 22 18 Z" fill="url(#p_gold)" />
      <circle cx="0" cy="60" r="6" fill="#991b1b" />
    </g>
    <g transform="translate(704, 420)" filter="url(#p_glow)">
      <circle cx="0" cy="0" r="14" fill="url(#p_gold)" />
      <path d="M -22 18 Q 0 55 22 18 Z" fill="url(#p_gold)" />
      <circle cx="0" cy="60" r="6" fill="#991b1b" />
    </g>

    <!-- Folded Hands with Heavy Gold Bangles (Boss Akka Stance) -->
    <g transform="translate(360, 780)" filter="url(#p_shadow)">
      <rect x="0" y="0" width="304" height="70" rx="35" fill="url(#p_skin)" stroke="#9a3412" stroke-width="4" />
      <!-- Gold Bangles on both wrists -->
      <rect x="20" y="10" width="12" height="50" rx="6" fill="url(#p_gold)" />
      <rect x="36" y="10" width="12" height="50" rx="6" fill="url(#p_gold)" />
      <rect x="52" y="10" width="12" height="50" rx="6" fill="#991b1b" />
      <rect x="240" y="10" width="12" height="50" rx="6" fill="#991b1b" />
      <rect x="256" y="10" width="12" height="50" rx="6" fill="url(#p_gold)" />
      <rect x="272" y="10" width="12" height="50" rx="6" fill="url(#p_gold)" />
    </g>

    <!-- Boss Crown & Respect Sparkles -->
    <text x="512" y="80" font-size="44" fill="#facc15" text-anchor="middle" filter="url(#p_glow)">👑</text>
    <text x="220" y="280" font-size="40" fill="#facc15" filter="url(#p_glow)">✨</text>
    <text x="800" y="280" font-size="40" fill="#facc15" filter="url(#p_glow)">✨</text>
  </svg>`;

  const characters = [
    { id: "soundarya", svg: soundaryaSvg, name: "Serial Soundarya" },
    { id: "kokila", svg: kokilaSvg, name: "Kolaaru Kokila" },
    { id: "padmini", svg: padminiSvg, name: "Pottu Padmini" },
  ];

  for (const c of characters) {
    const pngPrimary = path.join(outDir, `${c.id}.png`);
    const png3D = path.join(outDir, `${c.id}_3d.png`);
    const avatarPath = path.join(outDir, `${c.id}_avatar.png`);

    const buf = Buffer.from(c.svg);
    await sharp(buf).png({ quality: 95 }).toFile(pngPrimary);
    await sharp(buf).png({ quality: 95 }).toFile(png3D);
    await sharp(buf).resize(512, 512, { fit: "cover" }).png({ quality: 90 }).toFile(avatarPath);

    console.log(`  ✅ Generated 3D render files for [${c.name}] (${c.id})`);
  }
}

if (process.argv[1]?.includes("generateLadyCharacters")) {
  generateLadyCharacterRenders()
    .then(() => console.log("🎉 All 3 lady character renders created successfully!"))
    .catch((err) => console.error("❌ Error generating lady character renders:", err));
}
