import { useEffect, useState } from 'react';
import { Image } from 'react-native';

import { Rider } from '../data/types';
import { useStore } from '../store/AppStore';
import { Avatar } from './ui';

/** The rider's photo, or their initials when there is no photo (or it can't load right now). */
export function RiderAvatar({ rider, size = 40 }: { rider?: Pick<Rider, 'initials' | 'photo' | 'name'>; size?: number }) {
  const { photoUrl } = useStore();
  const photo = rider?.photo;
  // Remember which photo the loaded address belongs to, so a changed photo never shows the old one.
  const [loaded, setLoaded] = useState<{ photo: string; uri: string | null } | null>(null);
  const uri = photo && loaded?.photo === photo ? loaded.uri : null;

  useEffect(() => {
    let live = true;
    if (photo) {
      photoUrl(photo)
        .then((u) => live && setLoaded({ photo, uri: u }))
        .catch(() => {});
    }
    return () => {
      live = false;
    };
  }, [photo, photoUrl]);

  if (!uri) return <Avatar initials={rider?.initials ?? '?'} size={size} />;
  return (
    <Image
      source={{ uri }}
      style={{ width: size, height: size, borderRadius: size / 2 }}
      accessibilityLabel={rider?.name ? `Photo of ${rider.name}` : 'Photo'}
    />
  );
}
