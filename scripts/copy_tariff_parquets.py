#!/usr/bin/env python3
"""Copy OCPI tariff parquet pairs into the local dataviz tariff directory."""

from __future__ import annotations

import argparse
import shutil
from pathlib import Path


DEFAULT_SOURCE_DIR = Path(
    "/home/erwan/Desktop/clients/MinistereTransitionEcologique/IRVE/OCPI/data"
)
DEFAULT_DESTINATION_DIR = Path(
    "/home/erwan/Desktop/clients/MinistereTransitionEcologique/qualicharge-dataviz/data/tariffs"
)
TARIFF_FILES = ("qualicharge_tariff.parquet", "qualicharge_tariffpdc.parquet")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Copy each provider's qualicharge tariff parquet pair from the OCPI "
            "data directory into data/tariffs/<provider>/."
        )
    )
    parser.add_argument(
        "--source-dir",
        type=Path,
        default=DEFAULT_SOURCE_DIR,
        help=f"OCPI data root containing provider directories. Default: {DEFAULT_SOURCE_DIR}",
    )
    parser.add_argument(
        "--destination-dir",
        type=Path,
        default=DEFAULT_DESTINATION_DIR,
        help=f"Dataviz tariff root. Default: {DEFAULT_DESTINATION_DIR}",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print copy operations without writing files.",
    )
    return parser.parse_args()


def discover_provider_dirs(source_dir: Path) -> list[Path]:
    if not source_dir.is_dir():
        raise FileNotFoundError(f"Source directory does not exist: {source_dir}")

    provider_dirs = sorted(path for path in source_dir.iterdir() if path.is_dir())
    complete_provider_dirs = []

    for provider_dir in provider_dirs:
        if all((provider_dir / file_name).is_file() for file_name in TARIFF_FILES):
            complete_provider_dirs.append(provider_dir)

    if not complete_provider_dirs:
        expected = ", ".join(TARIFF_FILES)
        raise FileNotFoundError(
            f"No provider directories in {source_dir} contain the expected files: {expected}"
        )

    return complete_provider_dirs


def copy_provider_files(provider_dir: Path, destination_dir: Path, dry_run: bool) -> int:
    provider_destination = destination_dir / provider_dir.name
    copied_count = 0

    if dry_run:
        print(f"Would create {provider_destination}")
    else:
        provider_destination.mkdir(parents=True, exist_ok=True)

    for file_name in TARIFF_FILES:
        source_file = provider_dir / file_name
        destination_file = provider_destination / file_name

        if dry_run:
            print(f"Would copy {source_file} -> {destination_file}")
        else:
            shutil.copy2(source_file, destination_file)
            print(f"Copied {source_file} -> {destination_file}")

        copied_count += 1

    return copied_count


def main() -> None:
    args = parse_args()
    provider_dirs = discover_provider_dirs(args.source_dir)
    copied_count = 0

    for provider_dir in provider_dirs:
        copied_count += copy_provider_files(
            provider_dir=provider_dir,
            destination_dir=args.destination_dir,
            dry_run=args.dry_run,
        )

    action = "Would copy" if args.dry_run else "Copied"
    print(f"{action} {copied_count} files from {len(provider_dirs)} providers.")


if __name__ == "__main__":
    main()
