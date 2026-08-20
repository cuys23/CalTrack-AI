<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>@yield('title') — CalTrack AI</title>
    <style>
        :root {
            --ground: #ffffff;
            --ink: #16202b;
            --ink-soft: #47586a;
            --rule: #d9e2ea;
            --accent: #14567f;
        }

        @media (prefers-color-scheme: dark) {
            :root {
                --ground: #0d141b;
                --ink: #e6edf3;
                --ink-soft: #b3c2ce;
                --rule: #263441;
                --accent: #74b4dd;
            }
        }

        * { box-sizing: border-box; }

        body {
            margin: 0;
            padding: 0 20px 80px;
            background: var(--ground);
            color: var(--ink);
            font: 16px/1.65 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            -webkit-text-size-adjust: 100%;
        }

        main { max-width: 680px; margin: 0 auto; }

        header {
            padding: 48px 0 20px;
            border-bottom: 2px solid var(--ink);
            margin-bottom: 32px;
        }

        h1 { font-size: 28px; line-height: 1.2; margin: 0 0 8px; letter-spacing: -0.02em; }
        h2 { font-size: 19px; margin: 36px 0 10px; letter-spacing: -0.01em; }
        p, li { color: var(--ink-soft); }
        li { margin-bottom: 6px; }
        table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 15px; }
        th, td { text-align: left; padding: 10px 12px 10px 0; border-bottom: 1px solid var(--rule); vertical-align: top; }
        th { color: var(--ink); font-size: 13px; text-transform: uppercase; letter-spacing: 0.06em; }
        td { color: var(--ink-soft); }
        .updated { font-size: 14px; color: var(--ink-soft); margin: 0; }
        a { color: var(--accent); }
        footer {
            margin-top: 48px;
            padding-top: 20px;
            border-top: 1px solid var(--rule);
            font-size: 14px;
            color: var(--ink-soft);
        }
        .tw { overflow-x: auto; }
    </style>
</head>
<body>
<main>
    <header>
        <h1>@yield('title')</h1>
        <p class="updated">Cập nhật lần cuối: {{ $lastUpdated }}</p>
    </header>

    @yield('content')

    <footer>
        <p>
            CalTrack AI ·
            <a href="{{ url('/legal/privacy') }}">Chính sách quyền riêng tư</a> ·
            <a href="{{ url('/legal/terms') }}">Điều khoản sử dụng</a> ·
            <a href="{{ url('/support') }}">Hỗ trợ</a>
        </p>
        <p>Liên hệ: <a href="mailto:{{ $supportEmail }}">{{ $supportEmail }}</a></p>
    </footer>
</main>
</body>
</html>
