'use client';

import { useState } from 'react';
import {
  FaWhatsapp,
  FaFacebook,
  FaXTwitter,
  FaTelegram,
  FaQq,
  FaWeixin,
} from 'react-icons/fa6';

export default function ShareButtons({
  url,
  title,
}: {
  url: string;
  title: string;
}) {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const links = [
    {
      name: 'WhatsApp',
      icon: FaWhatsapp,
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    },
    {
      name: 'Facebook',
      icon: FaFacebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      name: 'X',
      icon: FaXTwitter,
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    },
    {
      name: 'Telegram',
      icon: FaTelegram,
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
    },
    {
      name: 'QQ',
      icon: FaQq,
      href: `https://connect.qq.com/widget/shareqq/index.html?url=${encodedUrl}&title=${encodedTitle}`,
    },
  ];

  const handleWechatClick = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制链接失败:', err);
    }
  };

  return (
    <div className="relative flex items-center gap-4">
      {links.map(({ name, icon: Icon, href }) => (
        <a
          key={name}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`分享到 ${name}`}
          className="text-gray-400 hover:text-green-400 transition text-xl"
        >
          <Icon />
        </a>
      ))}

      <button
        onClick={handleWechatClick}
        aria-label="分享到微信"
        className="text-gray-400 hover:text-green-400 transition text-xl"
      >
        <FaWeixin />
      </button>

      {copied && (
        <span className="absolute -top-8 left-0 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white">
          链接已复制，请在微信中粘贴分享
        </span>
      )}
    </div>
  );
}
