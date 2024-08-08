<a name="top"></a>

<div class="container-fluid">
  <div class="row">
    <div class="col-sm-8 nav_element">
        <img src="<?php echo APP_LOGO_PATH ?>" 
             style="height: 30px"/>
        &nbsp;&nbsp;&nbsp;
        <span class="small">
        [ <?php echo ExecutionContext::getCurrentUserName(); ?> ]
        </span>
        &nbsp;&nbsp;
        <b>{{pageTitle}}</b>&nbsp;&nbsp;[{{levels.join(',')}}]
        &nbsp;&nbsp;&nbsp;
        <div class="sec-visual">
            <table>
              <tr>
                <td ng-repeat="section in chapterDetails.sections">
                    <div ng-class="getSectionDisplayClass( section )"></div>
                </td>
              </tr>
            </table>
        </div>
    </div>
    <div class="col-sm-4 nav_element">
        <div class="pull-right" style="margin-top: 3px">
            <a ng-click="toggleNotesLayout()">
                <span class="glyphicon glyphicon-equalizer gi-1-5x"></span>
            </a>
            &nbsp;
            <a ng-click="toggleUserStatistics()">
                <span class="glyphicon glyphicon-screenshot gi-1-5x"></span>
            </a>
            &nbsp;
            <a href="/apps/jove_notes/ng/dashboard/index.php">
                <span class="glyphicon glyphicon-eye-open gi-1-5x"></span>
            </a>
        </div>
    </div>
  </div>
</div>

<div class="floating_notes_menu">
    <a ng-click="scrollTo('top')">
        <span class="glyphicon glyphicon-arrow-up gi-2x"></span>
    </a>
    <p>
    <a ng-click="toggleUserStatistics()">
        <span class="glyphicon glyphicon-screenshot gi-2x"></span>
    </a>
    <p>
    <a href="/apps/jove_notes/ng/dashboard/index.php">
        <span class="glyphicon glyphicon-eye-open gi-2x"></span>
    </a>
    <p>
    <a ng-click="scrollTo('bottom')">
        <span class="glyphicon glyphicon-arrow-down gi-2x"></span>
    </a>
    <p>
    <a ng-click="nextChapter()">
        <span class="glyphicon glyphicon-forward gi-3x"
              style="color:red;"></span>
    </a>
</div>


