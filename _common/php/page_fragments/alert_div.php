<div style="position:fixed; top:0; right:0; width:400px;z-index:100;">
  <alert ng-repeat="alert in alerts" type="{{alert.type}}" 
         close="closeAlert($index)">
  {{alert.msg}}
  </alert>
</div>
