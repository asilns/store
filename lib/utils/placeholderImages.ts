// Placeholder image utilities using free demo image services

export const placeholderImages = {
  // Product images
  product: {
    small: 'https://picsum.photos/100/100?random=',
    medium: 'https://picsum.photos/200/200?random=',
    large: 'https://picsum.photos/400/400?random=',
  },
  
  // User avatars
  avatar: {
    small: 'https://i.pravatar.cc/40?img=',
    medium: 'https://i.pravatar.cc/80?img=',
    large: 'https://i.pravatar.cc/150?img=',
  },
  
  // Store logos
  logo: {
    small: 'https://via.placeholder.com/100x100/4F46E5/FFFFFF?text=',
    medium: 'https://via.placeholder.com/200x200/4F46E5/FFFFFF?text=',
    large: 'https://via.placeholder.com/400x200/4F46E5/FFFFFF?text=',
  },
  
  // Category images
  category: {
    electronics: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=300&fit=crop',
    clothing: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop',
    home: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
    beauty: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=300&fit=crop',
    sports: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
    books: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
  },
  
  // Generic placeholders
  generic: {
    square: 'https://via.placeholder.com/200x200/E5E7EB/6B7280?text=Image',
    rectangle: 'https://via.placeholder.com/400x200/E5E7EB/6B7280?text=Image',
    wide: 'https://via.placeholder.com/600x200/E5E7EB/6B7280?text=Image',
  }
};

// Get a random placeholder image
export function getRandomPlaceholder(type: keyof typeof placeholderImages, size: string, seed?: number): string {
  const category = placeholderImages[type];
  if (!category) return placeholderImages.generic.square;
  
  const image = category[size as keyof typeof category];
  if (!image) return placeholderImages.generic.square;
  
  const imageStr = String(image);
  if (imageStr.includes('random=') || imageStr.includes('img=')) {
    const randomSeed = seed || Math.floor(Math.random() * 100);
    return `${imageStr}${randomSeed}`;
  }
  
  return imageStr;
}

// Get a placeholder image for a specific category
export function getCategoryImage(category: string, size: 'small' | 'medium' | 'large' = 'medium'): string {
  const categoryKey = category.toLowerCase() as keyof typeof placeholderImages.category;
  const categoryImage = placeholderImages.category[categoryKey];
  
  if (categoryImage) {
    return categoryImage;
  }
  
  // Fallback to generic placeholder
  return placeholderImages.generic.square;
}

// Get a user avatar
export function getUserAvatar(user_id: string, size: 'small' | 'medium' | 'large' = 'medium'): string {
  const avatar = placeholderImages.avatar[size];
  const hash = user_id.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  const seed = Math.abs(hash) % 70; // 70 different avatar images available
  return `${avatar}${seed}`;
}

// Get a product image
export function getProductImage(productId: string, size: 'small' | 'medium' | 'large' = 'medium'): string {
  const product = placeholderImages.product[size];
  const hash = productId.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  const seed = Math.abs(hash) % 1000; // 1000 different random images
  return `${product}${seed}`;
}

// Get a store logo
export function getStoreLogo(storeName: string, size: 'small' | 'medium' | 'large' = 'medium'): string {
  const logo = placeholderImages.logo[size];
  return `${logo}${encodeURIComponent(storeName.substring(0, 3).toUpperCase())}`;
}
