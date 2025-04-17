import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import mime from 'mime-types';

/**
 * Uploads a file without image processing.
 * @param file The file with an arrayBuffer method and a name property.
 * @param destinationFolder The folder to upload to, defaults to 'public/uploads'.
 * @returns File details including name, path, extension, mimeType, and size.
 */
export async function uploadFile(file: { arrayBuffer: () => Promise<ArrayBuffer>; name: string }, destinationFolder = 'public/uploads') {
    console.log(file, "Uploading file...");

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const extension = path.extname(file.name).toLowerCase();
    const mimeType = mime.lookup(extension) || 'application/octet-stream';

    const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, 14);
    const uniqueId = uuidv4();
    const fileExtension = extension.slice(1);
    const fileName = `${timestamp}-${uniqueId}.${fileExtension}`;

    const filePath = path.join(destinationFolder, fileName);

    await fs.promises.mkdir(destinationFolder, { recursive: true });

    await fs.promises.writeFile(filePath, buffer);

    return {
        fileName,
        path: filePath.replace('public', ""),
        extension: fileExtension,
        mimeType: mimeType,
    };
}

/**
 * Deletes a file from the server.
 * @param filePath The path of the file to delete.
 */
export async function deleteFile(filePath: string) {
    try {
        const resolvedPath = path.resolve('public', filePath.replace(/^\/?/, ''));
        const fileExists = await fs.promises.access(resolvedPath, fs.constants.F_OK).then(() => true).catch(() => false);

        if (!fileExists) {
            console.warn(`File not found, skipping deletion: ${resolvedPath}`);
            return;
        }

        await fs.promises.unlink(resolvedPath);
        console.log(`File deleted successfully: ${resolvedPath}`);
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error(`Failed to delete file: ${error.message}`);
            throw new Error(`Failed to delete file: ${error.message}`);
        } else {
            console.error('Failed to delete file due to an unknown error');
            throw new Error('Failed to delete file due to an unknown error');
        }
    }
}
