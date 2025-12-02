interface ShareButtonProps {
  tier: string;
  emoji: string;
  percentile: string;
}

export default function ShareButton({ tier, emoji, percentile }: ShareButtonProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://rankxrp.com';

  const tweetText = `I'm a ${emoji} ${tier} - Top ${percentile}% of XRP holders!\n\nFind your rank at`;
  const shareUrl = appUrl;

  const twitterIntentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(shareUrl)}`;

  return (
    <a
      href={twitterIntentUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="btn-secondary inline-flex items-center gap-2 text-sm"
    >
      <svg
        className="w-5 h-5"
        fill="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
      Share on X
    </a>
  );
}
