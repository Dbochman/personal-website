import { Link } from 'react-router-dom';
import { ExternalLink, Vote, Volume2, Music, History, Zap, Users, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const FEATURES = [
  {
    icon: Music,
    title: 'Collaborative Queue',
    description: 'Everyone sees the same queue. Add songs, and they play on each person\'s own Spotify.',
  },
  {
    icon: Vote,
    title: 'Democratic Voting',
    description: 'Upvote songs you want to hear sooner. The queue reorders based on votes.',
  },
  {
    icon: Zap,
    title: 'Bender Mode',
    description: 'When the queue runs dry, Bender auto-fills with contextually relevant tracks.',
  },
  {
    icon: History,
    title: 'Throwback Feature',
    description: 'Revisit songs from the original 2017-2018 play logs at The Echo Nest and Spotify.',
  },
  {
    icon: Volume2,
    title: 'Airhorns & Sound Effects',
    description: 'Trigger sound effects for celebrations, transitions, or just because.',
  },
  {
    icon: Users,
    title: 'Office & Party Ready',
    description: 'Built for shared spaces. Works great for offices, parties, and hangouts.',
  },
];

export default function Andre() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          A collaborative music queue system born at The Echo Nest, refined at Spotify,
          and resurrected for the modern era. Add songs, vote on the queue, and let the
          music flow.
        </p>
        <Button asChild size="lg" className="gap-2">
          <a href="https://andre.dylanbochman.com" target="_blank" rel="noopener noreferrer">
            Launch Andre
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </div>

      {/* Features Grid */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Features</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <Card key={feature.title}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <feature.icon className="h-5 w-5 text-muted-foreground" />
                  <CardTitle as="h3" className="text-base">{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Getting Started */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Getting Started</h2>
        <div className="space-y-4 text-muted-foreground">
          <ol className="list-decimal list-inside space-y-2">
            <li>Open Andre and sign in with your Google account</li>
            <li>Click the <strong>Other</strong> tab</li>
            <li>Click <strong>Play music here</strong> to authenticate with Spotify</li>
            <li>Make sure Spotify is playing something (anything works)</li>
            <li>You're in - start adding songs to the queue</li>
          </ol>
        </div>
      </div>

      {/* How It Works */}
      <div>
        <h2 className="text-xl font-semibold mb-4">How It Works</h2>
        <div className="space-y-4 text-muted-foreground">
          <ol className="list-decimal list-inside space-y-2">
            <li>Search for songs and add them to the shared queue</li>
            <li>Vote on queued songs to influence play order</li>
            <li>Watch the queue update in real-time via WebSockets</li>
            <li>When the queue empties, Bender kicks in with auto-fill suggestions</li>
          </ol>
        </div>
      </div>

      {/* Queuing and Voting */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Queuing and Voting</h2>
        <div className="space-y-4 text-muted-foreground text-sm">
          <p>
            The queue you see is only half the story. Where a newly-added song lands depends on
            a penalty system designed to keep things fair.
          </p>
          <p>
            Queue position is based on when a song was added, plus penalties. The penalty formula:
            the total length of all songs you already have in the queue, plus 2 raised to the power
            of how many songs you have queued. If you're spamming songs with overlapping title words
            and they make up more than half the queue, those count double for the exponential penalty.
          </p>
          <p className="font-medium text-foreground">Example:</p>
          <p>
            Alice, Bob, and Carol are listening. At time 0, Alice adds two 7-minute songs to an empty
            queue. Five minutes later, Bob adds two songs, then Carol adds three. Carol's third song
            and Bob's second both have "love" in the title.
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Alice's first song: 0 penalty (2⁰)</li>
            <li>Alice's second song: 9 min penalty (7 + 2¹)</li>
            <li>Bob's first song: 0 penalty, enters at 5 min</li>
            <li>Bob's second song: 5 min penalty (3 + 2¹)</li>
            <li>Carol's first song: 0 penalty, enters at 5 min</li>
            <li>Carol's second song: 6 min penalty (4 + 2¹)</li>
            <li>Carol's third song: 13 min penalty (5 + 2³ due to keyword overlap)</li>
          </ul>
          <p>Resulting queue order:</p>
          <ol className="list-decimal list-inside space-y-1 ml-4 font-mono text-xs">
            <li>Bob1 - 5 min</li>
            <li>Carol1 - 5 min</li>
            <li>Alice2 - 9 min</li>
            <li>Bob2 - 10 min</li>
            <li>Carol2 - 11 min</li>
            <li>Carol3 - 18 min</li>
          </ol>
        </div>
      </div>

      {/* Requirements */}
      <div>
        <h2 className="text-xl font-semibold mb-4">What You Need</h2>
        <div className="space-y-3 text-muted-foreground">
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Google account</strong> - Sign in to access the queue</li>
            <li><strong>Spotify Premium</strong> - Authenticated locally on your device for playback</li>
            <li><strong>Gravatar</strong> (optional) - If you have a picture on <a href="http://www.gravatar.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">gravatar.com</a>, it'll show as your user image</li>
          </ul>
        </div>
      </div>

      {/* Blog Post Link */}
      <div className="border-t pt-6">
        <Button asChild variant="outline" className="gap-2">
          <Link to="/blog/2026-02-04-andre-collaborative-music-queue">
            <BookOpen className="h-4 w-4" />
            Read the full history
          </Link>
        </Button>
        <p className="text-sm text-muted-foreground mt-2">
          The Echo Nest origins, the office rules, Bender's time capsule feature, and the architecture.
        </p>
      </div>
    </div>
  );
}
