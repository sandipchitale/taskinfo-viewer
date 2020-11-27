import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { TranslateModule } from "@ngx-translate/core";

import { ButtonModule } from "primeng/button";
import { OrganizationChartModule } from "primeng/organizationchart";
import { TableModule } from "primeng/table";
import { ToolbarModule } from "primeng/toolbar";
import { TreeTableModule } from "primeng/treetable";
import { SelectButtonModule } from 'primeng/selectbutton';

import { PageNotFoundComponent } from "./components/";
import { WebviewDirective } from "./directives/";
import { FormsModule } from "@angular/forms";

@NgModule({
  declarations: [PageNotFoundComponent, WebviewDirective],
  imports: [CommonModule, TranslateModule, FormsModule, ButtonModule, OrganizationChartModule, SelectButtonModule, TableModule, ToolbarModule, TreeTableModule],
  exports: [TranslateModule, WebviewDirective, FormsModule, ButtonModule, OrganizationChartModule, SelectButtonModule, TableModule, ToolbarModule, TreeTableModule],
})
export class SharedModule {}
