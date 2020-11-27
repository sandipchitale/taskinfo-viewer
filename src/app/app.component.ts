import { remote, shell } from "electron";
import * as os from "os";
import * as fs from "fs";
import * as path from "path";

import { Component } from "@angular/core";
import { TreeNode } from "primeng/api";

import { ElectronService } from "./core/services";
import { TranslateService } from "@ngx-translate/core";
import { AppConfig } from "../environments/environment";

import { SelectItem } from 'primeng/api';


type Mode = 'Org' | 'Tree' | 'Order';


interface TaskInfo {
  name: string;
  path: string;
  finalizer: boolean;
  group: string;
  type: string;
  queuePosition: number;
  repeat?: boolean,
  dependencies?: TaskInfo[];
}

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
})
export class AppComponent {
  modes: SelectItem<Mode>[] = [
    { icon: 'pi pi-clone',   title: 'Tree',  value: 'Tree' },
    { icon: 'pi pi-sitemap', title: 'Org',   value: 'Org' },
    { icon: 'pi pi-bars',    title: 'Order', value: 'Order'},
  ];

  mode: Mode = this.modes[0].value;

  taskinfoFilePath;

  taskinfoTreeNodes: TreeNode<TaskInfo>[] = [];

  taskinfos: TaskInfo[] = [];
  orderedTaskInfos: TaskInfo[] = [];

  constructor(
    private electronService: ElectronService,
    private translate: TranslateService
  ) {
    this.translate.setDefaultLang("en");
    console.log("AppConfig", AppConfig);

    if (electronService.isElectron) {
      console.log(process.env);
      console.log("Run in electron");
      console.log("Electron ipcRenderer", this.electronService.ipcRenderer);
      console.log("NodeJS childProcess", this.electronService.childProcess);
    } else {
      console.log("Run in browser");
    }
  }

  loadTaskInfos(): void {
    remote.dialog
      .showOpenDialog({
        title: "Select a taskinfo file",
        filters: [
          {
            extensions: ["json"],
            name: "taskinfo file",
          },
        ],
        properties: ["openFile"],
      })
      .then((taskinfoFilePaths) => {
        if (taskinfoFilePaths.canceled || taskinfoFilePaths.filePaths.length === 0 ) {
          console.log("You didn't select a file");
          return;
        }
        this.taskinfoFilePath = taskinfoFilePaths.filePaths[0];
        this.taskinfos = [
          JSON.parse(
            fs.readFileSync(this.taskinfoFilePath, {
              encoding: "utf8",
              flag: "r",
            })
          ),
        ];
        this.orderedTaskInfos = [];
        this.taskinfoTreeNodes = this.taskinfosToTreeNodes(this.taskinfos, this.orderedTaskInfos, []);
        // Sort
        this.orderedTaskInfos.sort((tia: TaskInfo, tib: TaskInfo) => {
          if(tia.queuePosition > tib.queuePosition) {
            return 1;
          } else if(tia.queuePosition < tib.queuePosition) {
            return -1;
          } else {
            return 0;
          }
        });
      });
  }

  taskinfosToTreeNodes(taskinfos: Array<TaskInfo>, orderedTaskInfos: Array<TaskInfo>, seen: Array<string>): TreeNode[] {
    const taskinfoTreeNodes: TreeNode[] = [];
    taskinfos.forEach((taskinfo: TaskInfo) => {
      const treeNode = {
        data: taskinfo,
        children: [],
        expanded: false
      };
      if (seen.indexOf(taskinfo.path) === -1) {
        seen.push(taskinfo.path);
        treeNode.data.repeat = false;
        orderedTaskInfos.push(taskinfo);
      } else {
        treeNode.data.path += " (Repeat)";
        treeNode.data.repeat = true;
      }
      if (taskinfo.dependencies && taskinfo.dependencies.length > 0) {
        treeNode.children = this.taskinfosToTreeNodes(
          taskinfo.dependencies,
          orderedTaskInfos,
          seen
        );
      }
      if (treeNode.children) {
        treeNode.expanded = true;
      }
      taskinfoTreeNodes.push(treeNode);
    });
    return taskinfoTreeNodes;
  }

  configureGradleTaskInfo(): void {
    const initDotD = path.join(os.homedir(), '.gradle', 'init.d');
    const applyGradleTaskinfoDotGradle = path.join(initDotD, 'apply-gradle-taskinfo.gradle');
    if (!fs.existsSync(applyGradleTaskinfoDotGradle)) {
      fs.mkdirSync(initDotD, { recursive: true });
      fs.writeFileSync(path.join(initDotD, 'apply-gradle-taskinfo.gradle'), `initscript {
  repositories {
    maven {
      url "https://plugins.gradle.org/m2/"
    }
  }
  dependencies {
    classpath "gradle.plugin.org.barfuin.gradle.taskinfo:gradle-taskinfo:1.0.3"
  }
}

rootProject {
  apply plugin: org.barfuin.gradle.taskinfo.GradleTaskInfoPlugin

  taskinfo {
    clipped = true
    color = false
  }
}
`     );
    }
    shell.showItemInFolder(applyGradleTaskinfoDotGradle);
  }

  showGradleTaskInfoOnGitgub(): void {
    shell.openExternal('https://plugins.gradle.org/plugin/org.barfuin.gradle.taskinfo');
  }

  showOnGitgub(): void {
    shell.openExternal('https://github.com/sandipchitale/taskinfo-viewer');
  }

  exit(): void {
    remote.getCurrentWindow().close();
  }
}
