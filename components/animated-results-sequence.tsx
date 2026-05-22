'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import type { OptimizationResult } from '@/lib/optimization-engine';
import { ResultsHeroBanner, RecommendationCard, OptimizedStateMessage, SavingsCTA } from './form-and-results';
import styles from './credex.module.css';

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

interface AnimatedResultsSequenceProps {
  optimizationResult: OptimizationResult;
  savings: number;
  onConsultationClick: () => void;
  onNotifyClick: () => void;
}

/**
 * GSAP SCROLLTRIGGER ANIMATION SEQUENCE
 *
 * This component implements a complex, multi-stage scroll-driven animation:
 *
 * ARCHITECTURE:
 * - A virtual scroll track of 300vh pushes the viewport through the animation timeline
 * - The container is pinned (fixed) so the user "scrolls through" the card assembly
 * - Each card animates in sequence with staggered timing
 * - 3D transforms create depth perception (rotation + perspective + blur)
 *
 * PHASES:
 * 1. 0%-35%: 3D "unfold" - cards rotate from tilted to flat, blur clears
 * 2. 35%-65%: Laser scan - neon cyan line sweeps across savings card
 * 3. 65%-100%: Card arrival - analysis card slides in, bottom cards stack up
 */

export function AnimatedResultsSequence({
  optimizationResult,
  savings,
  onConsultationClick,
  onNotifyClick,
}: AnimatedResultsSequenceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const heroCardRef = useRef<HTMLDivElement>(null);
  const analysisCardRef = useRef<HTMLDivElement>(null);
  const insightsContainerRef = useRef<HTMLDivElement>(null);
  const laserLineRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!containerRef.current || !contentRef.current) return;

    // Kill any existing ScrollTrigger instances to prevent conflicts
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());

    const container = containerRef.current;
    const content = contentRef.current;
    const heroCard = heroCardRef.current;
    const analysisCard = analysisCardRef.current;
    const laserLine = laserLineRef.current;

    // Pin the animated content using ScrollTrigger instead of CSS fixed positioning.
    // This keeps the component in the normal document flow while still allowing
    // the entire layout to remain fixed during the animation sequence.
    ScrollTrigger.create({
      trigger: container,
      start: 'top top',
      end: 'bottom bottom',
      pin: content,
      pinSpacing: false,
      anticipatePin: 1,
      scrub: true,
    });

    const resizeHandler = () => {
      ScrollTrigger.refresh();
    };
    window.addEventListener('resize', resizeHandler);

    /**
     * PHASE 1: 3D UNFOLD (0% - 35%)
     *
     * The hero banner card starts rotated in 3D space (tilted on X and Y axes),
     * blurred, and pushed back on the Z-axis. As the user scrolls, it rotates
     * back to flat, blur clears, and it descends into its final position.
     *
     * Properties breakdown:
     * - rotationX/rotationY: Rotate the card to create a tilted 3D effect
     * - z: Push back on Z-axis for depth (creates perspective distance)
     * - filter blur: Simulate focus tracking as card "approaches"
     * - opacity: Fade in as card settles
     * - y: Vertical positioning as card descends
     */
    gsap.set(heroCard, {
      opacity: 0,
      rotationX: 45, // Tilted forward 45 degrees
      rotationY: -15, // Tilted slightly left
      z: -500, // Pushed back in 3D space
      filter: 'blur(15px)',
      y: -100,
      transformStyle: 'preserve-3d',
      transformPerspective: 1000,
    });

    // Hero card 3D unfold animation (Phase 1: 0-35%)
    gsap.to(heroCard, {
      scrollTrigger: {
        trigger: container,
        start: 'top top',
        end: '35% top',
        scrub: 1.5, // Smooth, organic momentum-based scrubbing
        markers: false,
      },
      opacity: 1,
      rotationX: 0, // Rotate back to flat
      rotationY: 0, // Align with viewport
      z: 0, // Bring forward to normal Z
      filter: 'blur(0px)', // Clear blur
      y: 0, // Settle in position
      duration: 1,
      ease: 'power3.inOut',
    });

    /**
     * PHASE 2: LASER SCAN (35% - 65%)
     *
     * A glowing neon-cyan laser scan line sweeps down from top to bottom
     * across the savings card. This creates a futuristic "analysis in progress"
     * effect and draws the user's attention to the key metrics.
     *
     * The laser line uses:
     * - A gradient that creates the glow effect
     * - Motion along the Y-axis from top to bottom
     * - Opacity fade-in and fade-out for smooth entrance/exit
     * - Box-shadow for the neon glow effect
     */
    if (laserLine) {
      gsap.set(laserLine, {
        opacity: 0,
        y: -200, // Start above the card
        boxShadow: '0 0 20px rgba(0, 255, 255, 0)',
      });

      gsap.to(laserLine, {
        scrollTrigger: {
          trigger: container,
          start: '35% top',
          end: '65% top',
          scrub: 1.5,
          markers: false,
        },
        opacity: 1,
        y: 400, // Sweep down across card
        boxShadow: '0 0 30px rgba(0, 255, 255, 0.8), 0 0 60px rgba(0, 255, 255, 0.4)',
        duration: 1,
        ease: 'power2.inOut',
      });
    }

    /**
     * PHASE 3: CARD ARRIVAL (65% - 100%)
     *
     * Multiple cards animate in with staggered timing:
     * 1. Analysis card slides in from the right side
     * 2. Insight cards stack up from the bottom with stagger effect
     *
     * Stagger creates a "cascade" effect where each card enters slightly after
     * the previous one, creating visual rhythm and hierarchy.
     */
    if (analysisCard) {
      gsap.set(analysisCard, {
        opacity: 0,
        x: 300, // Off-screen to the right
        filter: 'blur(10px)',
      });

      gsap.to(analysisCard, {
        scrollTrigger: {
          trigger: container,
          start: '65% top',
          end: '85% top',
          scrub: 1.5,
          markers: false,
        },
        opacity: 1,
        x: 0, // Slide to final position
        filter: 'blur(0px)',
        duration: 1,
        ease: 'power3.out',
      });
    }

    /**
     * STAGGERED CARD ARRIVAL (Bottom Cards)
     *
     * Each recommendation card slides up from the bottom with a delay:
     * - Card 0 starts at 65% scroll
     * - Card 1 starts at 70% scroll (staggered)
     * - Card 2 starts at 75% scroll (further staggered)
     *
     * This creates a flowing, sequential appearance that's visually satisfying.
     * The stagger value (0.05 = 5% of scroll range per card) controls the delay.
     */
    cardsRef.current.forEach((cardElement, index) => {
      if (!cardElement) return;

      gsap.set(cardElement, {
        opacity: 0,
        y: 100, // Start below final position
        filter: 'blur(8px)',
      });

      // Calculate staggered start position
      // Each card enters slightly after the previous
      const staggerOffset = index * 0.05; // 5% scroll offset per card
      const startPercent = 65 + staggerOffset * 35; // Scale to remaining scroll range

      gsap.to(cardElement, {
        scrollTrigger: {
          trigger: container,
          start: `${startPercent}% top`,
          end: `${Math.min(startPercent + 20, 100)}% top`,
          scrub: 1.5,
          markers: false,
        },
        opacity: 1,
        y: 0, // Slide to final position
        filter: 'blur(0px)',
        duration: 0.8,
        ease: 'power3.out',
      });
    });

    /**
     * SCROLL TRIGGER LIFECYCLE
     *
     * On component unmount, kill all ScrollTriggers to prevent memory leaks
     * and conflicts with other animations on the page.
     */
    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        // Create virtual scroll track (300vh = 3x viewport height)
        // This allows smooth, extended animation over longer scroll distance
        height: '300vh',
        position: 'relative',
      }}
    >
      {/* PINNED CONTENT CONTAINER */}
      <div
        ref={contentRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100vh',
          overflow: 'hidden',
          // Establish 3D context for perspective transforms
          perspective: '1200px',
          transformStyle: 'preserve-3d',
          zIndex: 10,
        }}
      >
        {/* BACKGROUND GRADIENT - Sets mood for the animation sequence */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(135deg, rgba(20, 20, 40, 0.9) 0%, rgba(40, 20, 60, 0.9) 100%)',
            zIndex: -1,
          }}
        />

        {/* SCROLL CONTENT WRAPPER - Centers and scales the content */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            maxWidth: '1000px',
            margin: '0 auto',
            width: '100%',
            overflow: 'auto',
          }}
        >
          {/* HERO BANNER CARD - Phase 1 Animation */}
          <div
            ref={heroCardRef}
            style={{
              width: '100%',
              marginBottom: '2rem',
              transformStyle: 'preserve-3d',
            }}
          >
            <ResultsHeroBanner
              monthlySavings={optimizationResult.totalMonthlySavings}
              annualSavings={optimizationResult.totalAnnualSavings}
            />
          </div>

          {/* LASER SCAN LINE - Phase 2 Animation */}
          <div
            ref={laserLineRef}
            style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              width: '80%',
              height: '8px',
              background:
                'linear-gradient(90deg, transparent, rgba(0, 255, 255, 1), transparent)',
              transform: 'translateX(-50%)',
              pointerEvents: 'none',
              borderRadius: '4px',
              filter: 'drop-shadow(0 0 20px rgba(0, 255, 255, 0.8))',
            }}
          />

          {/* ANALYSIS CARD - Phase 3 Animation (Part 1) */}
          <div
            ref={analysisCardRef}
            style={{
              width: '100%',
              marginBottom: '2rem',
              transformStyle: 'preserve-3d',
            }}
          >
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>
                AI Stack Analysis
              </h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                Based on your team configuration, we've analyzed your tool stack for redundancies
                and optimization opportunities. The recommendations below highlight specific actions
                you can take to reduce costs while maintaining or improving productivity.
              </p>
            </div>
          </div>

          {/* INSIGHTS CONTAINER - Phase 3 Animation (Part 2) - Staggered Cards */}
          <div
            ref={insightsContainerRef}
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>
              Actionable Insights
            </h3>

            {optimizationResult.isFullyOptimized ? (
              <div
                ref={(el) => {
                  if (el) cardsRef.current[0] = el;
                }}
              >
                <OptimizedStateMessage savings={optimizationResult.totalMonthlySavings} />
              </div>
            ) : (
              optimizationResult.recommendations.map((rec, index) => (
                <div
                  key={rec.toolId}
                  ref={(el) => {
                    if (el) cardsRef.current[index] = el;
                  }}
                >
                  <RecommendationCard recommendation={rec} index={index} />
                </div>
              ))
            )}
          </div>

          {/* CTA SECTION - Animates with final card */}
          <div
            ref={(el) => {
              if (el && cardsRef.current) cardsRef.current[cardsRef.current.length] = el;
            }}
            style={{ width: '100%', marginTop: '2rem' }}
          >
            <SavingsCTA
              savings={savings}
              onConsultationClick={onConsultationClick}
              onNotifyClick={onNotifyClick}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
