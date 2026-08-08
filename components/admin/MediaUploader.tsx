'use client';

import { useRef, useState } from 'react';
import { upload } from '@imagekit/next';
import { LuUpload, LuLoader } from 'react-icons/lu';

interface MediaUploaderProps {
    authToken: string;          // admin 密码,取自 sessionStorage
    accept?: string;            // 默认图片+视频
    label?: string;
    folder?: string;            // ImageKit 里的存放目录
    onUploaded: (url: string) => void;
}

export default function MediaUploader({
    authToken,
    accept = 'image/*,video/*',
    label = '上传图片/视频',
    folder = '/blog',
    onUploaded,
}: MediaUploaderProps) {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [uploading, setUploading] = useState(false);

    const handleFile = async (file: File) => {
        setUploading(true);
        try {
            const authRes = await fetch('/api/admin/upload-auth', {
                headers: { 'x-admin-password': authToken },
            });
            if (!authRes.ok) throw new Error('鉴权失败');
            const { token, expire, signature, publicKey } = await authRes.json();

            const result = await upload({
                file,
                fileName: file.name,
                folder,
                token,
                expire,
                signature,
                publicKey,
            });

            if (result.url) onUploaded(result.url);
        } catch (err) {
            console.error(err);
            alert('上传失败，请重试');
        } finally {
            setUploading(false);
            if (inputRef.current) inputRef.current.value = '';
        }
    };

    return (
        <>
            <input
                ref={inputRef}
                type="file"
                accept={accept}
                className="hidden"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                }}
            />
            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border bg-[#161b22] border-[#30363d] text-gray-400 hover:text-gray-200 transition disabled:opacity-50"
            >
                {uploading ? (
                    <LuLoader className="w-3.5 h-3.5 animate-spin" />
                ) : (
                    <LuUpload className="w-3.5 h-3.5" />
                )}
                {uploading ? '上传中…' : label}
            </button>
        </>
    );
}