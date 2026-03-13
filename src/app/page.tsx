"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12 }
  }
};

const item = {
  hidden: { opacity: 0, y: 25 },
  show: { opacity: 1, y: 0 }
};

export default function HomePage() {

  return (

    <div className="relative min-h-screen text-white overflow-hidden">

      {/* BACKGROUND GRADIENT GLOW */}

      <div className="absolute inset-0 bg-gradient-to-b from-blue-900/10 via-black to-black pointer-events-none"/>

      <div className="relative max-w-7xl mx-auto px-6 py-12">

        {/* HERO SECTION */}

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-24"
        >

          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 text-transparent bg-clip-text">
            CricSmart
          </h1>

          <p className="text-gray-400 text-lg mb-6">
            Real-Time Cricket Intelligence Platform
          </p>

          <p className="text-gray-500 max-w-2xl mx-auto mb-8">
            Analyze cricket matches with advanced analytics including
            win probability, momentum shifts, turning points,
            tactical phases, and broadcast insights.
          </p>

          <Link
            href="/matches"
            className="inline-block bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-lg font-semibold transition-all hover:scale-105 shadow-lg shadow-blue-500/20"
          >
            View Live Matches
          </Link>

        </motion.div>


        {/* LIVE MATCHES */}

        <div className="mb-24">

          <h2 className="text-xl font-semibold mb-8 text-gray-200">
            Live Matches
          </h2>

          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid md:grid-cols-3 gap-6"
          >

            {/* LIVE MATCH */}

            <motion.div variants={item} whileHover={{ scale: 1.04 }}>
              <Link
                href="/match/ind-aus"
                className="block border border-red-500/70 rounded-xl p-6 bg-zinc-900 hover:border-red-400 hover:shadow-xl hover:shadow-red-500/20 transition-all"
              >

                <p className="text-lg font-semibold">
                  India vs Australia
                </p>

                <p className="text-red-500 text-sm flex items-center gap-2 mt-1">
                  LIVE
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"/>
                </p>

                <p className="text-gray-400 text-sm mt-3">
                  India 122/2 (12.3)
                </p>

              </Link>
            </motion.div>


            {/* UPCOMING */}

            <motion.div variants={item} whileHover={{ scale: 1.04 }}>
              <Link
                href="/match/eng-pak"
                className="block border border-blue-500/70 rounded-xl p-6 bg-zinc-900 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/20 transition-all"
              >

                <p className="text-lg font-semibold">
                  England vs Pakistan
                </p>

                <p className="text-blue-400 text-sm mt-1">
                  Upcoming
                </p>

                <p className="text-gray-400 text-sm mt-3">
                  Starts 7:30 PM
                </p>

              </Link>
            </motion.div>


            {/* COMPLETED */}

            <motion.div variants={item} whileHover={{ scale: 1.04 }}>
              <Link
                href="/match/nz-sa"
                className="block border border-zinc-700 rounded-xl p-6 bg-zinc-900 hover:border-gray-500 hover:shadow-xl transition-all"
              >

                <p className="text-lg font-semibold">
                  New Zealand vs South Africa
                </p>

                <p className="text-gray-400 text-sm mt-1">
                  Completed
                </p>

                <p className="text-gray-500 text-sm mt-3">
                  NZ won by 5 wickets
                </p>

              </Link>
            </motion.div>

          </motion.div>

        </div>


        {/* FEATURES */}

        <div>

          <h2 className="text-xl font-semibold mb-8 text-gray-200">
            Platform Features
          </h2>

          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid md:grid-cols-4 gap-6"
          >

            <motion.div
              variants={item}
              whileHover={{ y: -6 }}
              className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 hover:border-blue-500 transition-all"
            >
              <h3 className="font-semibold mb-2">
                Win Probability
              </h3>

              <p className="text-gray-400 text-sm">
                Predict match outcome using real-time analytics.
              </p>
            </motion.div>


            <motion.div
              variants={item}
              whileHover={{ y: -6 }}
              className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 hover:border-green-500 transition-all"
            >
              <h3 className="font-semibold mb-2">
                Momentum Engine
              </h3>

              <p className="text-gray-400 text-sm">
                Track which team is dominating the match.
              </p>
            </motion.div>


            <motion.div
              variants={item}
              whileHover={{ y: -6 }}
              className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 hover:border-red-500 transition-all"
            >
              <h3 className="font-semibold mb-2">
                Turning Points
              </h3>

              <p className="text-gray-400 text-sm">
                Detect critical moments that changed the match.
              </p>
            </motion.div>


            <motion.div
              variants={item}
              whileHover={{ y: -6 }}
              className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 hover:border-purple-500 transition-all"
            >
              <h3 className="font-semibold mb-2">
                Replay Timeline
              </h3>

              <p className="text-gray-400 text-sm">
                Rewatch match events through an interactive timeline.
              </p>
            </motion.div>

          </motion.div>

        </div>

      </div>

    </div>

  );

}