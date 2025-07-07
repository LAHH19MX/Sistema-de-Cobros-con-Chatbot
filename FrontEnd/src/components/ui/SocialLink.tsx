// src/components/ui/SocialLink.tsx
import React from 'react';

interface SocialLinkProps {
  href: string;
  icon: string;
  className?: string;
}

const SocialLink: React.FC<SocialLinkProps> = ({ href, icon, className = '' }) => {
  // Mapeo de nombres a clases de Font Awesome (todo en minúsculas)
  const iconMap: Record<string, string> = {
    'facebook': 'fab fa-facebook-f',
    'twitter': 'fab fa-twitter',
    'x': 'fab fa-x-twitter',
    'instagram': 'fab fa-instagram',
    'youtube': 'fab fa-youtube',
    'linkedin': 'fab fa-linkedin-in',
    'tiktok': 'fab fa-tiktok',
    'whatsapp': 'fab fa-whatsapp',
  };

  // Convertir a minúsculas para el mapeo
  const iconClass = iconMap[icon.toLowerCase()] || `fab fa-${icon.toLowerCase()}`;
  
  console.log(`SocialLink - Icon: ${icon}, IconClass: ${iconClass}`); // Debug

  return (
    <a 
      href={href} 
      className={className}
      target="_blank" 
      rel="noopener noreferrer"
    >
      <i className={iconClass}></i>
    </a>
  );
};

export default SocialLink;