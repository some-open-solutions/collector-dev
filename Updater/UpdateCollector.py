######################################################################
# Update Collector from www.github.com/open-collector/open-collector #
# By Dr. Anthony Haffey                                              #
######################################################################

import os
import pygit2
import shutil
from distutils.dir_util import copy_tree

#Copy user folder somewhere safe

if os.path.isdir("update_backup") == False:
    os.mkdir("update_backup")

copy_tree("web/User", "update_backup")
print("User files updated");

if os.path.isdir("../Collector-update"):
    os.system('rmdir /S /Q "{}"'.format("../Collector-update"))

#Download open-collector
repoClone = pygit2.clone_repository("https://github.com/open-collector/open-collector",
                                   "../Collector-update")

#delete web folder
shutil.rmtree("web")
os.mkdir("web")    
copy_tree("../Collector-update/web","web")

#reinstate the User folder
if os.path.isdir("web/User") == False:
    os.mkdir("web/User")
copy_tree("update_backup", 
          "web/User")

shutil.copyfile("../Collector-update/Collector.py",
                "Collector.py")

if os.path.isdir("Updater") == False:
    os.mkdir("Updater")                
shutil.copyfile("../Collector-update/Updater/UpdateCollector.py",
                "Updater/UpdateCollector.py")

os.system("python -m eel Collector.py web --icon=collector.ico --noconfirm") #--noconsole


print("update complete")


os.system('rmdir /S /Q "{}"'.format("../Collector-update"))

print("removed Collector-update")