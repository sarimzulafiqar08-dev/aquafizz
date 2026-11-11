export const categories = [
  {
    slug: 'cold-drinks',
    name: 'Cold Drinks',
    description: 'Chilled sodas and energy drinks, ready for fast delivery.',
    image:
      'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?auto=format&fit=crop&w=900&q=80',
  },
  {
    slug: 'mineral-water',
    name: 'Mineral Water',
    description: 'Clean bottled water for home, office and family packs.',
    image:
      'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&w=900&q=80',
  },
  {
    slug: 'fresh-juices',
    name: 'Juices',
    description: 'Mango and fruit nectars with that summer-thirst finish.',
    image:
      'https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=900&q=80',
  },
  {
    slug: 'deal-boxes',
    name: 'Deal Boxes',
    description: 'Value packs for gatherings, iftar and family nights.',
    image:
      'https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=900&q=80',
  },
]

export const products = [
  {
    id: 'pepsi-500ml',
    slug: 'pepsi-500ml',
    name: 'Pepsi 500ml',
    brand: 'Pepsi',
    category: 'Cold Drinks',
    categorySlug: 'cold-drinks',
    size: '500ml',
    price: 120,
    stock: 86,
    featured: true,
    image:
      'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?auto=format&fit=crop&w=800&q=80',
    description:
      'Classic Pepsi in a convenient 500ml bottle. Ice-cold cola with a bold fizz, perfect for meals and on-the-go refreshment.',
  },
  {
    id: 'pepsi-1l',
    slug: 'pepsi-1l',
    name: 'Pepsi 1L',
    brand: 'Pepsi',
    category: 'Cold Drinks',
    categorySlug: 'cold-drinks',
    size: '1L',
    price: 190,
    stock: 8,
    featured: true,
    image:
      'https://images.unsplash.com/photo-1624517452488-04869289c4ca?auto=format&fit=crop&w=800&q=80',
    description:
      'Share-size Pepsi 1 litre bottle. Ideal for dinner tables and small gatherings when one 500ml is not enough.',
  },
  {
    id: '7up-500ml',
    slug: '7up-500ml',
    name: '7UP 500ml',
    brand: '7UP',
    category: 'Cold Drinks',
    categorySlug: 'cold-drinks',
    size: '500ml',
    price: 120,
    stock: 64,
    featured: true,
    image:
      'https://images.unsplash.com/photo-1624552184280-9e9631bbeee9?auto=format&fit=crop&w=800&q=80',
    description:
      'Crisp lemon-lime 7UP 500ml. Light, sparkling and a favourite with spicy food.',
  },
  {
    id: 'mountain-dew-500ml',
    slug: 'mountain-dew-500ml',
    name: 'Mountain Dew 500ml',
    brand: 'Mountain Dew',
    category: 'Cold Drinks',
    categorySlug: 'cold-drinks',
    size: '500ml',
    price: 130,
    stock: 41,
    featured: true,
    image:
      'https://images.unsplash.com/photo-1622543925917-763ac2cba758?auto=format&fit=crop&w=800&q=80',
    description:
      'Citrus-charged Mountain Dew 500ml. Energetic flavour with a sharp, refreshing kick.',
  },
  {
    id: 'mirinda-500ml',
    slug: 'mirinda-500ml',
    name: 'Mirinda 500ml',
    brand: 'Mirinda',
    category: 'Cold Drinks',
    categorySlug: 'cold-drinks',
    size: '500ml',
    price: 120,
    stock: 0,
    featured: false,
    image:
      'https://images.unsplash.com/photo-1624517452488-04869289c4ca?auto=format&fit=crop&w=800&q=80',
    description:
      'Sunny orange Mirinda 500ml. Sweet citrus fizz — currently restocking in some areas.',
  },
  {
    id: 'sting-500ml',
    slug: 'sting-energy-500ml',
    name: 'Sting Energy 500ml',
    brand: 'Sting',
    category: 'Cold Drinks',
    categorySlug: 'cold-drinks',
    size: '500ml',
    price: 140,
    stock: 52,
    featured: true,
    image:
      'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80',
    description:
      'Sting Energy 500ml for a berry-citrus boost. Popular after work, gym sessions and late nights.',
  },
  {
    id: 'aquafina-500ml',
    slug: 'aquafina-500ml',
    name: 'Aquafina 500ml',
    brand: 'Aquafina',
    category: 'Mineral Water',
    categorySlug: 'mineral-water',
    size: '500ml',
    price: 70,
    stock: 120,
    featured: true,
    image:
      'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&w=800&q=80',
    description:
      'Purified Aquafina 500ml. Everyday hydration in a travel-friendly bottle.',
  },
  {
    id: 'aquafina-1-5l',
    slug: 'aquafina-1-5l',
    name: 'Aquafina 1.5L',
    brand: 'Aquafina',
    category: 'Mineral Water',
    categorySlug: 'mineral-water',
    size: '1.5L',
    price: 110,
    stock: 73,
    featured: true,
    image:
      'https://images.unsplash.com/photo-1559839914-17aae19cec71?auto=format&fit=crop&w=800&q=80',
    description:
      'Family-size Aquafina 1.5L for home, office desks and long days out.',
  },
  {
    id: 'slice-mango-500ml',
    slug: 'slice-mango-500ml',
    name: 'Slice Mango 500ml',
    brand: 'Slice',
    category: 'Juices',
    categorySlug: 'fresh-juices',
    size: '500ml',
    price: 130,
    stock: 37,
    featured: true,
    image:
      'https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=800&q=80',
    description:
      'Thick mango Slice 500ml. A sweet, pulpy favourite that tastes like summer in a bottle.',
  },
  {
    id: 'family-drinks-deal-box',
    slug: 'family-drinks-deal-box',
    name: 'Family Drinks Deal Box',
    brand: 'AquaFizz',
    category: 'Deal Boxes',
    categorySlug: 'deal-boxes',
    size: '12 pcs',
    price: 1899,
    stock: 18,
    featured: true,
    image:
      'https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=800&q=80',
    description:
      'A mixed family box with colas, citrus sodas, water and juice — curated for parties, iftar and weekend hosting.',
  },
]

export const brands = [...new Set(products.map((p) => p.brand))]
export const sizes = [...new Set(products.map((p) => p.size))]
