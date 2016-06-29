/**
 * Here are some queries to try:
 *
 * ```
 * # get the `HomeComponent` class, including decorators
 * cq '.HomeComponent' examples/HomeComponent.ts
 *
 * # get the `HomeComponent` class @Component decoration
 * cq '.HomeComponent .Component' examples/HomeComponent.ts
 * ```
 * 
 */
import { Component } from '@angular/core';

@Component({
  selector: 'home',
  template: `<h1>Welcome!</h1>`
})
export class HomeComponent {
}
