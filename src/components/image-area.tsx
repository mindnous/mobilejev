import { Alert, Image, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { pickImage } from '@/lib/image';
import { useModel } from '@/lib/model';

type ImageAreaProps = {
  imageUri?: string;
  onChange: (imageUri?: string) => void;
};

/** A tap-to-upload box for one optional image. Shows the image once picked. */
export function ImageArea({ imageUri, onChange }: ImageAreaProps) {
  const theme = useTheme();
  const { mmprojName } = useModel();

  async function choose() {
    try {
      const uri = await pickImage(mmprojName);
      if (uri) onChange(uri);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : String(error));
    }
  }

  return (
    <>
      <Pressable
        onPress={choose}
        style={[styles.area, { borderColor: theme.textSecondary, backgroundColor: theme.backgroundElement }]}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
        ) : (
          <ThemedText themeColor="textSecondary">Tap to add an image (optional)</ThemedText>
        )}
      </Pressable>
      {imageUri && (
        <Pressable onPress={() => onChange(undefined)}>
          <ThemedText type="linkPrimary">Remove image</ThemedText>
        </Pressable>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  area: {
    minHeight: 120,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    aspectRatio: 4 / 3,
  },
});
