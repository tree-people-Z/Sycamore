pub fn build_export_html(body_html: &str, dark_mode: bool) -> String {
    let (bg, fg, code_bg, border, muted) = if dark_mode {
        ("#1c1c1e", "#f5f5f7", "#2c2c2e", "#38383a", "#98989d")
    } else {
        ("#ffffff", "#1d1d1f", "#f5f5f7", "#e5e5e5", "#86868f")
    };

    format!(
        r#"<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Exported</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
<style>
*{{margin:0;padding:0;box-sizing:border-box}}
body{{font-family:-apple-system,'Segoe UI','Inter','SF Pro Text',Roboto,Helvetica,Arial,sans-serif;background:{bg};color:{fg};line-height:1.8;padding:48px 64px;max-width:800px;margin:0 auto;font-size:16px;-webkit-font-smoothing:antialiased}}
h1{{font-size:34px;font-weight:700;margin:1em 0 0.3em;line-height:1.3}}
h2{{font-size:28px;font-weight:700;margin:1em 0 0.3em;line-height:1.3}}
h3{{font-size:24px;font-weight:600;margin:.8em 0 .2em}}
h4{{font-size:20px;font-weight:600;margin:.6em 0 .2em}}
h5{{font-size:18px;font-weight:600;margin:.6em 0 .2em}}
h6{{font-size:16px;font-weight:600;color:{muted};margin:.6em 0 .2em}}
p{{margin:.5em 0}}
a{{color:#007aff;text-decoration:underline}}
img{{max-width:100%;border-radius:6px;margin:8px 0}}
blockquote{{border-left:3px solid #007aff;padding:4px 16px;margin:12px 0;color:{muted};font-style:italic}}
code{{font-family:'SF Mono','SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;background:{code_bg};padding:1px 5px;border-radius:4px;font-size:.9em}}
pre{{background:{code_bg};border-radius:6px;padding:16px;margin:12px 0;overflow:auto}}
pre code{{background:none;padding:0;font-size:14px}}
table{{border-collapse:collapse;margin:12px 0;width:100%}}
th,td{{border:1px solid {border};padding:8px 12px;text-align:left}}
th{{background:{code_bg};font-weight:600}}
hr{{border:none;border-top:1px solid {border};margin:24px 0}}
ul,ol{{padding-left:24px;margin:8px 0}}
li{{margin:4px 0}}
input[type="checkbox"]{{margin-right:6px}}
.mermaid{{margin:16px 0;text-align:center}}
</style>
</head>
<body>{body_html}</body>
</html>"#
    )
}
