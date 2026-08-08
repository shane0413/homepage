// 文件路径: app/api/admin/verify-password/route.ts

export async function POST(req: Request) {
    try {
        const { password } = await req.json();

        // 在服务器端比较密码，浏览器无法看到实际值
        const isCorrect = password === process.env.ADMIN_PASSWORD;

        return Response.json({
            ok: isCorrect
        });
    } catch (err) {
        return Response.json(
            { error: '验证失败' },
            { status: 500 }
        );
    }
}
