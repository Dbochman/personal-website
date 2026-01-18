/**
 * Generate Open Graph images for all projects at build time
 * Uses satori for SVG rendering and @resvg/resvg-js for PNG conversion
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

// Load fonts
const interRegular = fs.readFileSync(path.join(__dirname, 'fonts', 'Inter-Regular.ttf'));
const interBold = fs.readFileSync(path.join(__dirname, 'fonts', 'Inter-Bold.ttf'));

// Load project metadata
const projectsMeta = JSON.parse(
  fs.readFileSync(path.join(projectRoot, 'src', 'data', 'projects-meta.json'), 'utf-8')
);

// Output directory
const outputDir = path.join(projectRoot, 'public', 'og-images');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Lucide icon SVG paths (24x24 viewBox)
const iconPaths = {
  Calculator: 'M4 2h16a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM8 6v4M16 6v4M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01',
  MessageSquare: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
  Clock: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 6v6l4 2',
  Columns: 'M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7m0-18H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7m0-18v18',
  BarChart3: 'M3 3v18h18M18 17V9M13 17V5M8 17v-3',
  ScrollText: 'M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v3h4M19 17V5a2 2 0 0 0-2-2H4M15 8h-5M15 12h-5',
  FileText: 'M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2zM14 2v6h6M16 13H8M16 17H8M10 9H8',
  Terminal: 'M4 17l6-6-6-6M12 19h8',
};

// Create icon SVG element for satori
function createIcon(iconName, size = 48) {
  const iconPath = iconPaths[iconName];
  if (!iconPath) return null;

  return {
    type: 'svg',
    props: {
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: '#a1a1aa',
      strokeWidth: 2,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      children: {
        type: 'path',
        props: { d: iconPath },
      },
    },
  };
}

// Generate OG image template for a project
function createOgTemplate(project) {
  const icon = createIcon(project.icon, 56);

  return {
    type: 'div',
    props: {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '60px',
        backgroundColor: '#030712',
        fontFamily: 'Inter',
      },
      children: [
        // Top section: Icon + Title
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
            },
            children: [
              // Icon and Title row
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                  },
                  children: [
                    icon,
                    {
                      type: 'div',
                      props: {
                        style: {
                          fontSize: '56px',
                          fontWeight: 700,
                          color: '#ffffff',
                          lineHeight: 1.2,
                        },
                        children: project.title,
                      },
                    },
                  ].filter(Boolean),
                },
              },
              // Description
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: '28px',
                    color: '#a1a1aa',
                    lineHeight: 1.4,
                    maxWidth: '900px',
                  },
                  children: project.description,
                },
              },
            ],
          },
        },
        // Bottom section: Tags + Site URL
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
            },
            children: [
              // Tags
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    gap: '12px',
                  },
                  children: project.tags.map((tag) => ({
                    type: 'div',
                    props: {
                      style: {
                        fontSize: '20px',
                        color: '#e4e4e7',
                        backgroundColor: '#27272a',
                        padding: '8px 16px',
                        borderRadius: '9999px',
                      },
                      children: tag,
                    },
                  })),
                },
              },
              // Site URL
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: '24px',
                    color: '#71717a',
                  },
                  children: 'dylanbochman.com',
                },
              },
            ],
          },
        },
      ],
    },
  };
}

async function generateOgImage(project) {
  const template = createOgTemplate(project);

  // Generate SVG with satori
  const svg = await satori(template, {
    width: 1200,
    height: 630,
    fonts: [
      {
        name: 'Inter',
        data: interRegular,
        weight: 400,
        style: 'normal',
      },
      {
        name: 'Inter',
        data: interBold,
        weight: 700,
        style: 'normal',
      },
    ],
  });

  // Convert SVG to PNG with resvg
  const resvg = new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: 1200,
    },
  });
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  // Write PNG to output directory
  const outputPath = path.join(outputDir, `${project.slug}.png`);
  fs.writeFileSync(outputPath, pngBuffer);

  return outputPath;
}

async function main() {
  console.log('Generating OG images for projects...');

  const failures = [];

  for (const project of projectsMeta) {
    try {
      const outputPath = await generateOgImage(project);
      console.log(`  ✓ ${project.slug}.png`);
    } catch (error) {
      console.error(`  ✗ ${project.slug}: ${error.message}`);
      failures.push({ slug: project.slug, error: error.message });
    }
  }

  const successCount = projectsMeta.length - failures.length;
  console.log(`\nGenerated ${successCount}/${projectsMeta.length} OG images to ${outputDir}`);

  if (failures.length > 0) {
    console.error(`\n${failures.length} image(s) failed to generate:`);
    failures.forEach(({ slug, error }) => console.error(`  - ${slug}: ${error}`));
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Failed to generate OG images:', error);
  process.exit(1);
});
