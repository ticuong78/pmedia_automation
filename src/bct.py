import json
import re
from pathlib import Path
from typing import Optional, List, Dict

import requests
import typer
from bs4 import BeautifulSoup
from urllib.parse import urljoin

app = typer.Typer(
    help="Find tags whose href contains a given domain/substring (BeautifulSoup + Typer)."
)


def load_html(url: Optional[str], html_file: Optional[Path]) -> tuple[str, str]:
    if (url is None) == (html_file is None):
        raise typer.BadParameter("Chỉ chọn 1 trong 2: --url hoặc --html-file")

    if url:
        resp = requests.get(url, timeout=20, headers={"User-Agent": "Mozilla/5.0"})
        resp.raise_for_status()
        return resp.text, url

    # html_file
    text = html_file.read_text(encoding="utf-8", errors="ignore")
    # base dùng file:// để urljoin không lỗi (tuỳ bạn)
    return text, f"file://{html_file.resolve()}"


def find_href_tags(
    html: str,
    base: str,
    contains: str,
    only_a: bool,
    absolutize: bool,
) -> List[Dict[str, str]]:
    soup = BeautifulSoup(html, "lxml")

    # CSS selector: mọi thẻ có href chứa substring
    selector = f'a[href*="{contains}"]' if only_a else f'[href*="{contains}"]'
    tags = soup.select(selector)

    results: List[Dict[str, str]] = []
    for t in tags:
        href = t.get("href", "")
        full = urljoin(base, href) if absolutize else href

        results.append(
            {
                "tag": t.name,
                "href": full,
                "text": t.get_text(strip=True) if t.name == "a" else "",
            }
        )
    return results


@app.command("find")
def cmd_find(
    url: Optional[str] = typer.Option(None, help="URL cần crawl"),
    html_file: Optional[Path] = typer.Option(
        None, exists=True, dir_okay=False, help="Đường dẫn file HTML local"
    ),
    contains: str = typer.Option(
        "online.gov.vn", help="Chuỗi/domain cần nằm trong href"
    ),
    only_a: bool = typer.Option(False, help="Chỉ tìm thẻ <a>"),
    absolutize: bool = typer.Option(True, help="Chuẩn hoá href thành URL tuyệt đối"),
):
    html, base = load_html(url, html_file)
    results = find_href_tags(html, base, contains, only_a, absolutize)

    typer.echo(len(results))


if __name__ == "__main__":
    app()
