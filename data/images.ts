/**
 * Home hero collage: real photos of flats REHLO lists (Estancia, Guduvanchery and a
 * still from the Abode Valley, Potheri video tour), served from /public so they
 * ship with the site. Each has the focal point to keep in view when cropped.
 */
export const HERO_PHOTOS = {
  living: {
    src: "/images/hero/estancia-living.webp",
    alt: "Furnished living room with an L-shaped sofa in an Estancia flat, Guduvanchery",
    position: "object-[65%_50%]",
  },
  kitchen: {
    src: "/images/hero/estancia-kitchen.webp",
    alt: "Modular kitchen with a hob and chimney in an Estancia flat",
    position: "object-[55%_50%]",
  },
  dining: {
    src: "/images/hero/abode-dining.jpg",
    alt: "Dining area by the balcony door in an Abode Valley flat, Potheri",
    position: "object-center",
  },
} as const;
