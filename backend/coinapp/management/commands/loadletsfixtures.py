import shutil
from pathlib import Path

from django.conf import settings
from django.core.management import call_command
from django.core.management.base import BaseCommand

class Command(BaseCommand):
    help = "Load fixtures and copy fixture media"
    def handle(self, *args, **kwargs):
        fixture_media = Path("coinapp/fixture_media")
        media_root = Path(settings.MEDIA_ROOT)
        if fixture_media.exists():
            for file in fixture_media.rglob("*"):
                if file.is_file():
                    dest = media_root / file.relative_to(fixture_media)
                    dest.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copy(file, dest)
        else:
            self.stdout.write("No such folder coinapp/fixture_media.")
        call_command("loaddata", "pixl")
        call_command("loaddata", "kkde")
        call_command("loaddata", "vdky")
        self.stdout.write(self.style.SUCCESS("Fixtures loaded with images"))