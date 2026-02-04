import { ExternalLink, Vote, Volume2, Music, History, Zap, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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

const TECH_STACK = [
  'Flask',
  'Python 3',
  'Spotify Web API',
  'WebSockets',
  'Redis',
  'Docker',
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

      {/* How It Works */}
      <div>
        <h2 className="text-xl font-semibold mb-4">How It Works</h2>
        <div className="space-y-4 text-muted-foreground">
          <ol className="list-decimal list-inside space-y-2">
            <li>Open Andre on any device connected to your Spotify session</li>
            <li>Search for songs and add them to the shared queue</li>
            <li>Vote on queued songs to influence play order</li>
            <li>Watch the queue update in real-time via WebSockets</li>
            <li>When the queue empties, Bender kicks in with auto-fill suggestions</li>
          </ol>
        </div>
      </div>

      {/* Origin Story */}
      <div>
        <h2 className="text-xl font-semibold mb-4">The Story</h2>
        <div className="prose prose-zinc dark:prose-invert max-w-none text-muted-foreground">
          <p>
            Andre started life as "Prosecco" at The Echo Nest around 2014. It was the office
            jukebox - a way for everyone to contribute to the music without fighting over
            the aux cord.
          </p>
          <p>
            When Spotify acquired The Echo Nest, some of us forked it internally. The voting
            system emerged from actual office debates about what should play next. Bender mode
            (named after the Futurama character) solved the eternal "queue is empty and nobody
            wants to pick" problem.
          </p>
          <p>
            In 2024-2026, I modernized the codebase: Python 3, cleaned up dependencies, and
            added the throwback feature that pulls from our original 2017-2018 play logs.
            Those logs are a time capsule of what we listened to during some formative years.
          </p>
        </div>
      </div>

      {/* Tech Stack */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Tech Stack</h2>
        <div className="flex flex-wrap gap-2">
          {TECH_STACK.map((tech) => (
            <Badge key={tech} variant="outline">
              {tech}
            </Badge>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center pt-4">
        <Button asChild variant="outline" size="lg" className="gap-2">
          <a href="https://andre.dylanbochman.com" target="_blank" rel="noopener noreferrer">
            Try Andre Now
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </div>
    </div>
  );
}
