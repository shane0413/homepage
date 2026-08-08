import { getUploadAuthParams } from '@imagekit/next/server';
import { isAdminAuthorized, unauthorizedResponse } from '@/lib/admin-auth';

export async function GET(request: Request) {
    if (!isAdminAuthorized(request)) {
        return unauthorizedResponse();
    }

    const { token, expire, signature } = getUploadAuthParams({
        privateKey: process.env.IMAGEKIT_PRIVATE_KEY as string,
        publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY as string,
    });

    return Response.json({
        token,
        expire,
        signature,
        publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY,
    });
}