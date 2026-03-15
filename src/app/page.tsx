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

      {/* HERO BACKGROUND LIGHT */}

      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-purple-600/20 blur-[160px] rounded-full pointer-events-none"/>

      <div className="absolute top-40 left-20 w-[600px] h-[600px] bg-blue-600/20 blur-[140px] rounded-full pointer-events-none"/>

      <div className="absolute inset-0 bg-gradient-to-b from-blue-900/10 via-black to-black pointer-events-none"/>

      <div className="relative max-w-7xl mx-auto px-6 py-16">

        {/* HERO SECTION */}

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-28"
        >

          <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 text-transparent bg-clip-text">
            CricSmart
          </h1>

          <p className="text-gray-300 text-xl mb-6">
            Real-Time Cricket Intelligence Platform
          </p>

          <p className="text-gray-500 max-w-2xl mx-auto mb-10 text-sm leading-relaxed">
            Analyze cricket matches with advanced analytics including
            win probability, momentum shifts, turning points,
            tactical phases, and broadcast insights.
          </p>

          <Link
            href="/matches"
            className="inline-block bg-blue-600 hover:bg-blue-500 px-10 py-4 rounded-xl font-semibold transition-all hover:scale-105 shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50"          >
            View Live Matches
          </Link>

        </motion.div>


        {/* LIVE MATCHES */}

        <div className="mb-28">

          <h2 className="text-2xl font-semibold mb-10 text-gray-200">
            Live Matches
          </h2>

          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid md:grid-cols-3 gap-8"
          >

            {/* LIVE MATCH */}

            <motion.div variants={item} whileHover={{ scale: 1.05 }}>
              <Link
                href="/match/india-vs-australia"
                className="block border border-red-500/60 rounded-xl p-6 bg-zinc-900 hover:border-red-400 hover:shadow-2xl hover:shadow-red-500/30 transition-all"
              >

                <p className="text-lg font-semibold">
                  India vs Australia
                </p>

                <p className="text-red-500 text-sm flex items-center gap-2 mt-2">
                  LIVE
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"/>
                </p>

                <p className="text-gray-400 text-sm mt-4">
                  India 122/2 (12.3)
                </p>

              </Link>
            </motion.div>


            {/* UPCOMING */}

            <motion.div variants={item} whileHover={{ scale: 1.05 }}>
              <Link
                href="/match/england-vs-pakistan"
                className="block border border-blue-500/60 rounded-xl p-6 bg-zinc-900 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-500/30 transition-all"
              >

                <p className="text-lg font-semibold">
                  England vs Pakistan
                </p>

                <p className="text-blue-400 text-sm mt-2">
                  Upcoming
                </p>

                <p className="text-gray-400 text-sm mt-4">
                  Starts 7:30 PM
                </p>

              </Link>
            </motion.div>


            {/* COMPLETED */}

            <motion.div variants={item} whileHover={{ scale: 1.05 }}>
              <Link
                href="/match/new-zealand-vs-south-africa"
                className="block border border-zinc-700 rounded-xl p-6 bg-zinc-900 hover:border-gray-500 hover:shadow-xl transition-all"
              >

                <p className="text-lg font-semibold">
                  New Zealand vs South Africa
                </p>

                <p className="text-gray-400 text-sm mt-2">
                  Completed
                </p>

                <p className="text-gray-500 text-sm mt-4">
                  NZ won by 5 wickets
                </p>

              </Link>
            </motion.div>

          </motion.div>

        </div>


        {/* FEATURES */}

        <div>

          <h2 className="text-2xl font-semibold mb-10 text-gray-200">
            Platform Features
          </h2>

          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid md:grid-cols-4 gap-8"
          >

            <motion.div
              variants={item}
              whileHover={{ y: -6 }}
              className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 hover:border-blue-500 hover:shadow-lg transition-all"
            >
              <h3 className="font-semibold mb-3">
                Win Probability
              </h3>

              <p className="text-gray-400 text-sm">
                Predict match outcome using real-time analytics.
              </p>
            </motion.div>


            <motion.div
              variants={item}
              whileHover={{ y: -6 }}
              className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 hover:border-green-500 hover:shadow-lg transition-all"
            >
              <h3 className="font-semibold mb-3">
                Momentum Engine
              </h3>

              <p className="text-gray-400 text-sm">
                Track which team is dominating the match.
              </p>
            </motion.div>


            <motion.div
              variants={item}
              whileHover={{ y: -6 }}
              className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 hover:border-red-500 hover:shadow-lg transition-all"
            >
              <h3 className="font-semibold mb-3">
                Turning Points
              </h3>

              <p className="text-gray-400 text-sm">
                Detect critical moments that changed the match.
              </p>
            </motion.div>


            <motion.div
              variants={item}
              whileHover={{ y: -6 }}
              className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 hover:border-purple-500 hover:shadow-lg transition-all"
            >
              <h3 className="font-semibold mb-3">
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