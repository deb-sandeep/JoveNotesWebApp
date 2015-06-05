<div style="position:fixed; top:0; right:0; left:0;z-index:100;">
  <alert ng-repeat="alert in alerts" type="{{alert.type}}" 
         close="closeAlert($index)">
  {{alert.msg}}
  </alert>
</div>
