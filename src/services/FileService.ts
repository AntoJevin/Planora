import * as FileSystem from 'expo-file-system';

const documentDirectory = (FileSystem as any).documentDirectory;


export const FileService = {
    /**
     * Copies a file from a temporary location to a permanent one in the document directory
     * @param sourceUri The temporary URI of the image
     * @param type The type of image (profile or logo)
     * @returns The permanent URI of the copied image
     */
    saveImageToPermanentStorage: async (sourceUri: string, type: 'profile' | 'logo'): Promise<string> => {
        try {
            if (!sourceUri) return '';

            // If it's already in permanent storage, return it
            if (sourceUri.includes(documentDirectory!)) {
                return sourceUri;
            }

            const fileName = `${type}_${Date.now()}.${sourceUri.split('.').pop()}`;
            const permanentUri = `${documentDirectory}${fileName}`;

            await FileSystem.copyAsync({
                from: sourceUri,
                to: permanentUri
            });

            console.log(`✅ Image saved permanently: ${permanentUri}`);
            return permanentUri;
        } catch (error) {
            console.error(`Error saving image permanently:`, error);
            return sourceUri; // Fallback to original
        }
    },

    /**
     * Deletes a file if it exists
     * @param uri The URI of the file to delete
     */
    deleteFile: async (uri: string): Promise<void> => {
        try {
            if (!uri) return;
            const info = await FileSystem.getInfoAsync(uri);
            if (info.exists) {
                await FileSystem.deleteAsync(uri);
                console.log(`🗑️ Deleted file: ${uri}`);
            }
        } catch (error) {
            console.error('Error deleting file:', error);
        }
    }
};
