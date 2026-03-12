"use client";

import Link from "next/link";

export default function HomePage() {

  return (
    <div className="min-h-screen bg-black text-white">

      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* HERO SECTION */}

        <div className="text-center mb-16">

          <h1 className="text-5xl font-bold mb-4">
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
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold"
          >
            View Live Matches
          </Link>

        </div>

        {/* LIVE MATCHES PREVIEW */}

        <div className="mb-16">

          <h2 className="text-xl font-semibold mb-6">
            Live Matches
          </h2>

          <div className="grid md:grid-cols-3 gap-6">

            <Link
              href="/match/ind-aus"
              className="border border-red-500 rounded-xl p-5 hover:bg-gray-900"
            >
              <p className="text-lg font-semibold">
                India vs Australia
              </p>

              <p className="text-red-500 text-sm">
                LIVE
              </p>

              <p className="text-gray-400 text-sm mt-2">
                India 122/2 (12.3)
              </p>

            </Link>

            <Link
              href="/match/eng-pak"
              className="border border-blue-500 rounded-xl p-5 hover:bg-gray-900"
            >
              <p className="text-lg font-semibold">
                England vs Pakistan
              </p>

              <p className="text-blue-400 text-sm">
                Upcoming
              </p>

              <p className="text-gray-400 text-sm mt-2">
                Starts 7:30 PM
              </p>

            </Link>

            <Link
              href="/match/nz-sa"
              className="border border-gray-700 rounded-xl p-5 hover:bg-gray-900"
            >
              <p className="text-lg font-semibold">
                New Zealand vs South Africa
              </p>

              <p className="text-gray-400 text-sm">
                Completed
              </p>

              <p className="text-gray-500 text-sm mt-2">
                NZ won by 5 wickets
              </p>

            </Link>

          </div>

        </div>

        {/* PLATFORM FEATURES */}

        <div>

          <h2 className="text-xl font-semibold mb-6">
            Platform Features
          </h2>

          <div className="grid md:grid-cols-4 gap-6">

            <div className="bg-gray-900 p-5 rounded-xl">
              <h3 className="font-semibold mb-2">
                Win Probability
              </h3>
              <p className="text-gray-400 text-sm">
                Predict match outcome using real-time analytics.
              </p>
            </div>

            <div className="bg-gray-900 p-5 rounded-xl">
              <h3 className="font-semibold mb-2">
                Momentum Engine
              </h3>
              <p className="text-gray-400 text-sm">
                Track which team is dominating the match.
              </p>
            </div>

            <div className="bg-gray-900 p-5 rounded-xl">
              <h3 className="font-semibold mb-2">
                Turning Points
              </h3>
              <p className="text-gray-400 text-sm">
                Detect critical moments that changed the match.
              </p>
            </div>

            <div className="bg-gray-900 p-5 rounded-xl">
              <h3 className="font-semibold mb-2">
                Replay Timeline
              </h3>
              <p className="text-gray-400 text-sm">
                Rewatch match events through an interactive timeline.
              </p>
            </div>

          </div>

        </div>

      </div>

    </div>
  );

}