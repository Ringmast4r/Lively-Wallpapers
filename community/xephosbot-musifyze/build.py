import os
import sys
import zipfile


def read_gitignore(gitignore_path):
	with open(gitignore_path, 'r') as file:
		lines = file.read().splitlines()
	return lines


def zipdir(path, ziph, ignore_patterns):
	# ziph is zipfile handle
	for root, dirs, files in os.walk(path):
		ignore = False
		relpath = os.path.relpath(root, path)
		for pattern in ignore_patterns:
			if relpath.startswith(pattern):
				ignore = True
				break
		if not ignore:
			for file in files:
				ziph.write(os.path.join(root, file), arcname=os.path.join(relpath, file))


if __name__ == '__main__':
	project_path = os.getcwd()
	archive_path = sys.argv[1]
	gitignore_path = os.path.join(project_path, '.gitignore')
	ignore_patterns = read_gitignore(gitignore_path)
	ignore_patterns.extend(('thumbnail.png', 'preview.gif'))

	if os.path.exists(archive_path):
		os.remove(archive_path)

	zipf = zipfile.ZipFile(archive_path, 'w', zipfile.ZIP_DEFLATED)
	zipdir(project_path, zipf, ignore_patterns)
	zipf.close()
