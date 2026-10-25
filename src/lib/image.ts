import * as ImagePicker from 'expo-image-picker';

/** Opens the photo library and returns the picked image's file:// URI, or null if canceled. */
export async function pickImage(mmprojName: string | null) {
  if (!mmprojName) throw new Error('Upload an mmproj file in the Model tab to send images.');
  // quality < 1 also converts the photo to JPEG (iOS HEIC photos can't be read by llama.cpp).
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 0.8 });
  return result.canceled ? null : result.assets[0].uri;
}
