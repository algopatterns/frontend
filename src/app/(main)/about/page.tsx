import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'A Letter from the Creator | Algorave',
  description:
    'Learn about Algorave, an open-source collaborative live coding music platform powered by Strudel. Built with ethical AI principles and respect for creator rights.',
  openGraph: {
    title: 'A Letter from the Creator | Algorave',
    description:
      'Learn about Algorave, an open-source collaborative live coding music platform built with ethical AI principles.',
    type: 'website',
  },
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <h1 className="text-4xl font-bold mb-2">A Letter from the Creator</h1>
      <p className="text-lg mb-12">
        <span className="text-orange-400">Live Code Music.</span>{' '}
        <span className="text-emerald-400">Respect Creators.</span>{' '}
        <span className="text-blue-400">Use AI &quot;Ethically&quot;.</span>
      </p>

      <section className="mb-12">
        <p className="text-muted-foreground mb-4">
          Algorave is a collaborative live coding music platform built on{' '}
          <a
            href="https://strudel.cc"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline">
            Strudel
          </a>
          , the powerful pattern language for music. But more than that, Algorave is an
          experiment in answering one of the most pressing questions in creative
          technology today:
        </p>
        <p className="text-lg font-semibold my-6">
          Can AI assist creative work without exploiting creators?
        </p>
        <p className="text-muted-foreground">
          I believe the answer is yes. But only with intentional design, technical
          safeguards, and respect for creator autonomy baked into every layer of the
          system.
        </p>
      </section>

      <hr className="my-8 border-border" />

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">The Origin Story</h2>
        <p className="text-muted-foreground mb-4">
          Algorave began with a simple question. After watching{' '}
          <a
            href="https://vt.tiktok.com/ZS53jrCTw/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline">
            Switch Angel live code a music session on TikTok
          </a>
          , narrating every creative decision in real-time while building beats from
          scratch, I wondered:
        </p>
        <p className="text-muted-foreground italic my-6 pl-4 border-l-2 border-violet-500">
          What if you could explore music production and pattern-making using natural
          language instructions? without memorizing syntax? What if the barrier to entry
          for live coding could be lower, while still respecting the craft?
        </p>
        <p className="text-muted-foreground mb-4">
          The goal was never to replace the skill and artistry of live coders. It was to
          open a door. To let curious newcomers like me to experiment with Strudel
          patterns, help stuck musicians find their next idea and generally make the
          language more accessible without diminishing its depth.
        </p>
        <p className="text-muted-foreground mb-4">
          I see a future where creators can easily talk to agents using natural language
          instructions (text/voice commands) and then get back{' '}
          <b className="text-white">authentic</b>, <b className="text-white">creative</b>{' '}
          music in real time - just like Switch Angel did on this TikTok series, however, she had
          to manually transcribe her thoughts and actions into text. With intelligent
          voice enabled agents, this will soon all be automated and you&apos;ll only
          need to speak the line of thought for your creative piece out loud and it will
          be transcribed and executed in real time while maintaining the integrity of your
          creative process.
        </p>
      </section>

      <hr className="my-8 border-border" />

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">The Problem I Had to Solve</h2>
        <p className="text-muted-foreground mb-4">
          While building Algorave, I watched a slightly similar ai-assisted music project
          launch and immediately face backlash. The project allegedly utilized public
          Strudel patterns, including CC-licensed work in its training data & prompts
          without permission and compatible licensing. The response from the community was
          swift and clear:
        </p>
        <p className="font-semibold my-6 pl-4 py-3 bg-amber-500/10 border-l-4 border-amber-500 rounded-r">
          AI tools built on creative work, without consent, are not welcome.
        </p>
        <p className="text-muted-foreground mb-4">
          This isn&apos;t just about legal compliance. It is about trust, autonomy, and
          the fundamental question of who benefits when AI meets art.
        </p>
        <p className="text-muted-foreground">
          I had a choice: abandon AI features entirely, or build something different.
          Something that treats creator rights as a core design constraint, not an
          afterthought.
        </p>
        <p className="text-muted-foreground mt-4">I opted for the latter.</p>
      </section>

      <hr className="my-8 border-border" />

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">
          My Philosophy: Consent as Architecture
        </h2>
        <p className="text-muted-foreground mb-4">
          Most AI systems treat creator preferences as an obstacle to work around. I treat
          them as the foundation to build upon.
        </p>
        <p className="text-muted-foreground mb-4">
          <strong>The core principle:</strong> AI assistance should only operate on
          content where the creator has explicitly permitted it. No inference, no
          assumptions, no &quot;opt-out by default.&quot;
        </p>
        <p className="text-muted-foreground">
          This isn&apos;t just policy. It&apos;s architecture. Every technical decision in
          Algorave is designed to make respecting creator wishes the path of least
          resistance.
        </p>
      </section>

      <hr className="my-8 border-border" />

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">
          How Algorave Enforces &quot;Ethical&quot; AI Use
        </h2>

        <div className="space-y-8 mt-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">
              <span className="text-blue-600">1.</span> Explicit Consent Framework
            </h3>
            <p className="text-muted-foreground mb-4">
              Creators choose their AI preferences when saving work via CC Signals:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-border rounded-lg">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-3 font-semibold">Signal</th>
                    <th className="text-left p-3 font-semibold">Meaning</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b border-border">
                    <td className="p-3 font-medium text-blue-600">CC-CR</td>
                    <td className="p-3">Allow AI use with attribution</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="p-3 font-medium text-emerald-600">CC-DC</td>
                    <td className="p-3">Attribution + support the creator</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="p-3 font-medium text-purple-600">CC-EC</td>
                    <td className="p-3">Attribution + contribute to the commons</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="p-3 font-medium text-amber-600">CC-OP</td>
                    <td className="p-3">Attribution + keep derivatives open</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-rose-600">No-AI</td>
                    <td className="p-3">Explicitly opt out of all AI assistance</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-muted-foreground mt-3">
              Even though CC signals aren&apos;t currently a widely adopted standard and
              there is no definite framework to implementing them, on algorave CC signals
              aren&apos;t just suggestions, they&apos;re enforced using custom logic i
              came up with in the hopes of pioneering/contributing to the mainstream
              adoption of these signals.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">
              <span className="text-emerald-600">2.</span> Inherited Restrictions on Forks
            </h3>
            <p className="text-muted-foreground mb-3">
              When you fork a strudel with a{' '}
              <code className="text-sm bg-muted px-1.5 py-0.5 rounded">no-ai</code>{' '}
              signal, that restriction travels with it. AI is automatically disabled for:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
              <li>
                Direct forks of{' '}
                <code className="text-sm bg-muted px-1.5 py-0.5 rounded">no-ai</code>{' '}
                strudels
              </li>
              <li>Subforks (forks of forks) down the entire lineage</li>
            </ul>
            <p className="text-muted-foreground mt-3">
              You cannot fork someone&apos;s work and then use AI on it if they explicitly
              opted out. The original creator&apos;s wishes are respected through the
              entire derivative chain.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">
              <span className="text-purple-600">3.</span> Server-Side Enforcement (Not
              Just UI)
            </h3>
            <p className="text-muted-foreground mb-3">
              When a user pastes code into the editor, the server:
            </p>
            <ol className="list-decimal list-inside text-muted-foreground space-y-1 ml-2">
              <li>
                <strong>Detects the paste</strong> via behavioral analysis (large code
                deltas)
              </li>
              <li>
                <strong>Checks the source</strong> against the database of strudels
              </li>
              <li>
                <strong>Validates CC signals</strong> for any matched content
              </li>
              <li>
                <strong>Locks AI features</strong> if the code has a{' '}
                <code className="text-sm bg-muted px-1.5 py-0.5 rounded">no-ai</code>{' '}
                signal
              </li>
            </ol>
            <p className="text-muted-foreground mt-3">
              This happens regardless of what the client reports. Spoofing the UI
              doesn&apos;t bypass protection (to a reasonable extent). The server
              validates independently.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">
              <span className="text-amber-600">4.</span> Paste Lock System
            </h3>
            <p className="text-muted-foreground mb-3">If you paste code that:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
              <li>
                Matches a public strudel with{' '}
                <code className="text-sm bg-muted px-1.5 py-0.5 rounded">no-ai</code>{' '}
                signal, or
              </li>
              <li>Comes from an unknown external source</li>
            </ul>
            <p className="text-muted-foreground mt-3">
              AI assistance is either <strong>permanently</strong> or{' '}
              <strong>temporarily disabled</strong> until you make significant edits (30%+
              changes via Levenshtein distance) depending on if the strudel is licensed
              with a CC signal or not.
            </p>
            <p className="text-muted-foreground mt-3">
              This ensures you&apos;ve genuinely engaged with and transformed the code
              before AI can assist in creating derivative work and also makes sure that
              you&apos;re not using AI to create derivative work without the
              creator&apos;s consent.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">
              <span className="text-rose-600">5.</span> No Automatic Code Injection
            </h3>
            <p className="text-muted-foreground mb-3">
              When the Agent suggests code, it <strong>never</strong> automatically
              updates your editor. You must:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
              <li>Manually copy the suggestion, or</li>
              <li>Explicitly click &quot;Update Editor&quot;</li>
            </ul>
            <p className="text-muted-foreground mt-3">
              This keeps you in control and creates a clear record of what came from AI
              versus your own creativity.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">
              <span className="text-emerald-600">6.</span> Source Attribution in AI
              Responses
            </h3>
            <p className="text-muted-foreground mb-3">
              Every AI response that draws from the knowledge base includes links to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
              <li>The Strudel documentation sections used</li>
              <li>Any community strudels that informed the suggestion</li>
            </ul>
            <p className="text-muted-foreground mt-3">
              You always know where the Agent&apos;s knowledge came from.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">
              <span className="text-blue-600">7.</span> Crawler Penalties
            </h3>
            <p className="text-muted-foreground">
              Bots and agents that ignore CC signals and attempt to scrape{' '}
              <code className="text-sm bg-muted px-1.5 py-0.5 rounded">no-ai</code>{' '}
              strudels face penalties. Algorave actively defends creator preferences
              against automated circumvention.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">
              <span className="text-purple-600">8.</span> Complete Opt-Out
            </h3>
            <p className="text-muted-foreground">
              Don&apos;t want AI at all? You can disable all AI features across the entire
              app. Algorave works perfectly fine as a pure live coding platform.
            </p>
          </div>
        </div>
      </section>

      <hr className="my-8 border-border" />

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">A Note on Imperfection</h2>
        <p className="text-muted-foreground mb-4">
          I want to be honest: these safeguards are not foolproof. Someone determined
          enough could find ways around them. They could simulate gradual typing instead
          of pasting. They could memorize code and retype it. They could use external
          tools to strip metadata before importing.
        </p>
        <p className="text-muted-foreground mb-4">
          I know this. I built the system anyway.
        </p>
        <p className="text-muted-foreground mb-4">
          Here&apos;s my thinking: perfect enforcement is impossible, but that was never
          the goal. The goal is to make respecting creator wishes the default, and to make
          circumvention require deliberate effort. If someone has to go out of their way
          to bypass these protections, they&apos;ve made a conscious choice to disregard a
          creator&apos;s explicit wishes. That&apos;s on them, not on the system.
        </p>
        <p className="text-muted-foreground mb-4">
          More importantly, the effort required to bypass these safeguards will almost
          always exceed the effort of just writing your own code or finding AI-permissive
          alternatives. The juice isn&apos;t worth the squeeze.
        </p>
        <p className="text-muted-foreground mb-4">
          These protections will continue to evolve. As I discover new bypass methods,
          I&apos;ll patch them. As the community identifies gaps, I&apos;ll address them.
          This is an ongoing commitment, not a finished product. The codebase is open
          precisely so others can help strengthen these safeguards over time.
        </p>
        <p className="text-muted-foreground">
          Perfect is the enemy of good. I&apos;d rather ship something that raises the bar
          meaningfully than wait forever for an unbreakable solution that doesn&apos;t
          exist.
        </p>
      </section>

      <hr className="my-8 border-border" />

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">What AI Actually Does in Algorave</h2>
        <p className="text-muted-foreground mb-4">
          Let me be clear about what the Agent is and isn&apos;t:
        </p>
        <div className="overflow-x-auto my-6">
          <table className="w-full text-sm border border-border rounded-lg">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 font-semibold border-r border-border bg-emerald-500/10 text-emerald-700">
                  What it is
                </th>
                <th className="text-left p-3 font-semibold bg-rose-500/10 text-rose-700">
                  What it isn&apos;t
                </th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-border">
                <td className="p-3 border-r border-border">
                  A documentation assistant for Strudel syntax
                </td>
                <td className="p-3">A replacement for creative skill</td>
              </tr>
              <tr className="border-b border-border">
                <td className="p-3 border-r border-border">
                  A pattern suggester that offers ideas on request
                </td>
                <td className="p-3">
                  A generator that produces &quot;complete songs&quot;
                </td>
              </tr>
              <tr>
                <td className="p-3 border-r border-border">
                  A learning tool for exploring live coding
                </td>
                <td className="p-3">A system trained on scraped creative work</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-muted-foreground">
          The Agent helps you understand Strudel better and move faster when you&apos;re
          stuck. It doesn&apos;t create art for you. It helps you create your own.
        </p>
      </section>

      <hr className="my-8 border-border" />

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Why This Matters Beyond Algorave</h2>
        <p className="text-muted-foreground mb-4">
          The tension between AI and creative communities isn&apos;t going away. As AI
          capabilities grow, this conflict will only intensify. Unless we build systems
          that prove another path is possible.
        </p>
        <p className="text-muted-foreground mb-4">
          Algorave is my contribution to that proof. I&apos;m demonstrating that:
        </p>
        <ol className="list-decimal list-inside text-muted-foreground space-y-2 ml-2">
          <li>
            <strong className="text-white">Technical enforcement</strong> of creator
            preferences is possible
          </li>
          <li>
            <strong className="text-white">Consent-first design</strong> can coexist with
            useful AI features
          </li>
          <li>
            <strong className="text-white">Transparency</strong> about data sources builds
            rather than erodes trust
          </li>
          <li>
            <strong className="text-white">Community values</strong> can be encoded into
            architecture, not just policy
          </li>
        </ol>
        <p className="text-muted-foreground mt-4">
          I don&apos;t claim to have solved everything. But I&apos;m building in public,
          documenting my decisions, and inviting scrutiny.
        </p>
      </section>

      <hr className="my-8 border-border" />

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Open Source and Accountability</h2>
        <p className="text-muted-foreground mb-4">
          Algorave is fully open source under AGPL-3.0. Every technical safeguard
          described above is in the codebase for anyone to inspect, critique, or improve.
        </p>
        <p className="text-muted-foreground mb-4">
          AGPL-3.0 is the right call because Strudel itself is AGPL-licensed, and Algorave
          as a platform wouldn&apos;t be possible without the incredible work done by all
          strudel open-source contributors. If you build on Strudel and/or Algorave, you
          inherit both of their capabilities and their commitment to staying open.
        </p>
        <p className="text-muted-foreground my-4">
          Some documentation located in the server repository on Codeberg include:
        </p>
        <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-2 mb-6">
          <li>
            <a
              href="https://codeberg.org/algorave/server/src/branch/main/docs/system-specs/ENFORCING-CC-SIGNALS.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:underline">
              Enforcing CC Signals
            </a>{' '}
            - Technical details of paste lock detection
          </li>
          <li>
            <a
              href="https://codeberg.org/algorave/server/src/branch/main/docs/system-specs/REDIS_BUFFER_ARCHITECTURE.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:underline">
              Redis Buffer Architecture
            </a>{' '}
            - How real-time state is handled
          </li>
          <li>
            <a
              href="https://codeberg.org/algorave/server/src/branch/main/docs/system-specs/RAG_ARCHITECTURE.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:underline">
              RAG Architecture
            </a>{' '}
            - How AI retrieval works
          </li>
          <li>
            <a
              href="https://codeberg.org/algorave/server/src/branch/main/docs/system-specs/PRODUCT_ARCHITECTURE.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:underline">
              Product Architecture
            </a>{' '}
            - Full system overview
          </li>
        </ul>
        <p className="text-muted-foreground">
          I believe the best way to earn trust is to show my work as well as my workflow.
        </p>
      </section>

      <hr className="my-8 border-border" />

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">To the Strudel Community</h2>
        <p className="text-muted-foreground mb-4">
          I know you&apos;ve been burned before. I know AI tools have extracted value from
          your work without permission. I understand the skepticism.
        </p>
        <p className="text-muted-foreground mb-4">
          I&apos;m not asking for blind trust. I&apos;m asking for the chance to
          demonstrate that AI assistance and creator rights can coexist. And I&apos;m
          inviting you to hold me accountable if this project falls short.
        </p>
        <p className="text-muted-foreground mb-4">
          If you find a flaw in these safeguards, tell me. If you think I&apos;ve missed
          something, open an issue. If you want to make this system stronger, contribute.
        </p>
        <p className="text-muted-foreground mb-4">
          I built Algorave, but I&apos;m not building it alone. It&apos;s open source, and
          the community will shape where it goes from here.
        </p>
      </section>

      <hr className="my-8 border-border" />

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Features</h2>
        <p className="text-muted-foreground mb-4">
          Beyond the experimental &quot;ethical&quot; framework, Algorave offers:
        </p>
        <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-2">
          <li>
            <strong className="text-white">Clean editor interface</strong> with syntax
            highlighting and a distraction-free design
          </li>
          <li>
            <strong className="text-white">DAW-style sample browser</strong> with
            categorized sound groups in the sidebar
          </li>
          <li>
            <strong className="text-white">Full Strudel support</strong> with the complete
            pattern language in your browser
          </li>
          <li>
            <strong className="text-white">Real-time collaboration</strong> for raving
            with friends in shared sessions
          </li>
          <li>
            <strong className="text-white">Save, share, and fork</strong> patterns from
            the community
          </li>
          <li>
            <strong className="text-white">Extensive sample library</strong> including
            drum machines, synths, and soundfonts
          </li>
          <li>
            <strong className="text-white">AI assistance</strong> (when permitted) for
            exploring new patterns
          </li>
        </ul>
      </section>

      <hr className="my-8 border-border" />

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Get Started</h2>
        <div className="space-y-2">
          <p className="text-muted-foreground">
            Ready to try live coding?{' '}
            <Link
              href="/"
              className="text-emerald-400 hover:text-emerald-300 hover:underline">
              Launch the editor →
            </Link>
          </p>
          <p className="text-muted-foreground">
            New to strudel/algorithmic composition?{' '}
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://strudel.cc/workshop/getting-started/"
              className="text-orange-500 hover:text-orange-400 hover:underline">
              Checkout the docs →
            </a>
          </p>
          <p className="text-muted-foreground">
            Want to dive into the code or contribute?{' '}
            <a
              href="https://codeberg.org/algorave"
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-400 hover:text-violet-300 hover:underline">
              View on Codeberg →
            </a>
          </p>
        </div>
      </section>

      <hr className="my-8 border-border" />

      <footer className="text-center">
        <p className="text-muted-foreground italic mb-4">
          Algorave: Where the beat drops and creator rights don&apos;t.
        </p>
      </footer>
    </div>
  );
}
