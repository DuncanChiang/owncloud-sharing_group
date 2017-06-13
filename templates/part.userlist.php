<div id="emptycontent" class="hidden ownGroup">
        <div class="icon-folder"></div>
        <h2><?php p($l->t('No groups')); ?></h2>
</div>
<div id="emptycontent" class="hidden favoriteGroup">
	<div class="icon-starred"></div>
	<h2><?php p($l->t('No favorites')); ?></h2>
</div>
<table id="filestable" class="grouptable">
    <thead>
        <tr>
            <th id='headerName' class="column-name">
                <div id="headerName-container">
                    <a class="name sort columntitle" data-sort="name"><span><?php p($l->t( 'Name' )); ?></span><span class="sort-indicator"></span></a>
                </div>
            </th>
        </tr>
    </thead>
    <tbody id="group-list" data-sort-groups="" class="filename">
        <tr id="everyone-group" data-gid="_everyone" data-usercount="" style="display: none">
        </tr>
    </tbody>
    <tfoot>
    </tfoot>
</table>


