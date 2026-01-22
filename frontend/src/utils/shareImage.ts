// Generate shareable result images for social media

interface ShareData {
  correct: number;
  total: number;
  xpEarned: number;
  categoryName?: string;
  username: string;
}

export async function generateShareImage(data: ShareData): Promise<Blob | null> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Set canvas size (Twitter/Facebook friendly 1200x630)
  canvas.width = 1200;
  canvas.height = 630;

  // Background gradient (Big Blue Cage colors)
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#0d1b2a');
  gradient.addColorStop(1, '#1b3a5a');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Add cage pattern overlay
  ctx.strokeStyle = 'rgba(255, 215, 0, 0.1)';
  ctx.lineWidth = 2;
  const gridSize = 40;
  for (let x = 0; x < canvas.width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // Logo area (top)
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 48px Inter, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('BIG BLUE CAGE', canvas.width / 2, 80);

  ctx.fillStyle = '#ffffff';
  ctx.font = '28px Inter, Arial, sans-serif';
  ctx.fillText('WRESTLING QUIZ', canvas.width / 2, 120);

  // Main results area
  const accuracy = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;

  // Large score circle
  const centerX = canvas.width / 2;
  const centerY = 300;
  const radius = 120;

  // Circle background
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 71, 171, 0.5)';
  ctx.fill();

  // Circle border
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.strokeStyle = '#ffd700';
  ctx.lineWidth = 6;
  ctx.stroke();

  // Accuracy percentage
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 72px Inter, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${accuracy}%`, centerX, centerY - 15);

  ctx.fillStyle = '#a0aec0';
  ctx.font = '24px Inter, Arial, sans-serif';
  ctx.fillText('ACCURACY', centerX, centerY + 35);

  // Score breakdown
  ctx.fillStyle = '#4ade80';
  ctx.font = 'bold 36px Inter, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${data.correct}/${data.total} Correct`, centerX, 470);

  // XP earned
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 32px Inter, Arial, sans-serif';
  ctx.fillText(`+${data.xpEarned} XP`, centerX, 520);

  // Category if provided
  if (data.categoryName) {
    ctx.fillStyle = '#a0aec0';
    ctx.font = '22px Inter, Arial, sans-serif';
    ctx.fillText(`Category: ${data.categoryName}`, centerX, 560);
  }

  // User attribution
  ctx.fillStyle = '#ffffff';
  ctx.font = '20px Inter, Arial, sans-serif';
  ctx.fillText(`Played by ${data.username}`, centerX, 600);

  // Call to action
  ctx.fillStyle = 'rgba(255, 215, 0, 0.8)';
  ctx.font = '18px Inter, Arial, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('bigbluecage.com/quiz', canvas.width - 40, canvas.height - 20);

  // Convert to blob
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/png');
  });
}

export async function shareResults(data: ShareData): Promise<void> {
  const accuracy = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
  const shareText = `I scored ${accuracy}% (${data.correct}/${data.total}) on the Big Blue Cage Wrestling Quiz and earned ${data.xpEarned} XP! Can you beat my score?`;
  const shareUrl = 'https://bigbluecage.com/quiz';

  // Try native share API first
  if (navigator.share) {
    const imageBlob = await generateShareImage(data);
    const files: File[] = [];

    if (imageBlob) {
      files.push(new File([imageBlob], 'wrestling-quiz-results.png', { type: 'image/png' }));
    }

    try {
      await navigator.share({
        title: 'Big Blue Cage Wrestling Quiz Results',
        text: shareText,
        url: shareUrl,
        ...(files.length > 0 && navigator.canShare?.({ files }) ? { files } : {})
      });
      return;
    } catch (err) {
      // User cancelled or share failed, fall through to download
      if ((err as Error).name !== 'AbortError') {
        console.log('Native share failed, falling back to download');
      } else {
        return; // User cancelled
      }
    }
  }

  // Fallback: download the image
  const imageBlob = await generateShareImage(data);
  if (imageBlob) {
    const url = URL.createObjectURL(imageBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wrestling-quiz-results.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export async function copyShareText(data: ShareData): Promise<boolean> {
  const accuracy = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
  const shareText = `I scored ${accuracy}% (${data.correct}/${data.total}) on the Big Blue Cage Wrestling Quiz and earned ${data.xpEarned} XP! Can you beat my score? 💪🏆\n\nhttps://bigbluecage.com/quiz`;

  try {
    await navigator.clipboard.writeText(shareText);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
}
