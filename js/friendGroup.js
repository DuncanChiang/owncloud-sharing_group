var $groupList,
    $GroupListLi,
	$sortGroupBy,
    appname = 'sharing_group';
    
var GroupList = {
	everyoneGID: '_everyone',
    groups: [],
    initgroup: $.Deferred(),
    group: $.Deferred(),
    groups_name: [],

    elementBelongsToAddGroup: function(el) {
		return !(el !== $('#newgroup-form').get(0) &&
		$('#newgroup-form').find($(el)).length === 0);
	},

    hasAddGroupNameText: function() {
		var name = $('#newgroup-name').val();
		
        return $.trim(name) !== '';
	},
    
    showGroup: function (gid) {
		UserList.empty();
        UserList.clearAll();
        var statereset = $('#checkuser').attr('checked') !== undefined || $('#checkuser').attr('indeterminate') !== undefined;
        
        if(statereset){
            $('#checkuser').tristate('state', false);
        }
        
        $groupList.find('li').removeClass('active');
        if (gid !== undefined && gid !== '') {
			GroupList.getGroupLI(gid).addClass('active');
            $('#checkuser').data({
                'user':$('#group-list').data(gid),
                'checkeduser':[]
            });
	        if (gid === '_everyone') {
                UserList.currentGid = gid; 
                
		        $userList.siblings('.loading').css('visibility', 'visible');
                UserList.update(gid);
            }
            else {
                UserList.currentGid = gid;
                UserList.update(gid);
            }
        }
	},
    
	isAddGroupButtonVisible: function() {
		return $('#newgroup-init').is(":visible");
	},

	toggleAddGroup: function(event) {
		if (GroupList.isAddGroupButtonVisible()) {
			event.stopPropagation();
			$('#newgroup-form').show();
			$('#newgroup-init').hide();
			$('#newgroup-name').focus();
			GroupList.handleAddGroupInput('');
		}
		else {
			$('#newgroup-form').hide();
			$('#newgroup-init').show();
			$('#newgroup-name').val('');
		}
	},

	handleAddGroupInput: function(input) {
		if(input.length) {
			$('#newgroup-form input[type="submit"]').attr('disabled', null);
		} else {
			$('#newgroup-form input[type="submit"]').attr('disabled', 'disabled');
		}
	},
    
    characterFilter: function(editInput, name, action){
        if (name.match(/(?=^\.|^_)|(?=\W+)(?!\.)/)) {
            editInput.addClass("ui-status-error");
        }
        else if(action == 'add' && $.inArray(name, GroupList.groups_name) > -1) {
            editInput.addClass("ui-status-error");
        }
        else {
            editInput.removeClass("ui-status-error");
        }
    },

	isGroupNameValid: function(groupname) {
		if ($.trim(groupname) === '') {
			OC.dialogs.alert(
				t(appname, 'A valid group name must be provided'),
				t(appname, 'Error creating group'));
			return false;
		}
		return true;
	},
    
    showErrorMsg :function ($editInput, key) {
        if(key == "16") {
            
            return;
        }
        if($editInput.hasClass('ui-status-error')) {
            OC.Notification.showTemporary(t(appname, 'A valid group name must be provided'),{isHTML: false, timeout: 1});
        }
    },

    editGroup: function($element) {
		var oldname = $element.find('.group-name').text();
		var gid = $element.data('gid');
		var $editInput = $('<input type="text" />').val(oldname).attr({ id:'editInput'});
        var button = $('<button>').attr({
            class:'new-button primary icon-checkmark-white', 
            style:'display: block', 
            id:'rename-button'
        });
        var group_editing = $('<li>').attr({class:'group editing'});
        
        $element.hide();
        $editInput.insertBefore($element).wrap(group_editing);
        $('.group.editing').append(button);
        var $tmpelem = $editInput.parent('li');
        $editInput.focus();

        $('#group-list').on('keyup', '#editInput', function(event) {
                var newname = $editInput.val();
                               
                GroupList.characterFilter($(this),newname);    
                GroupList.showErrorMsg($editInput, event.which);  
                
                if (event.which == $.ui.keyCode.ESCAPE) {
                    $tmpelem.remove();
                    $element.show();
                }
                
                if (newname != '' && event.which == $.ui.keyCode.ENTER && !$editInput.hasClass('ui-status-error')) {
                        $('#group-list').off('keyup')
                        GroupList.renameGroup($element , $tmpelem, gid, newname, oldname);
                }
        });
        
        $('#rename-button').click(function() {
            var newname = $editInput.val();
            
            if (newname != '' && !$editInput.hasClass('ui-status-error'))  {   
                GroupList.renameGroup($element, $tmpelem, gid, newname, oldname);
            }
        });
        
        $(document).on('click', function(event) {
            if (event.target.parentElement.className != 'group editing') {
                $tmpelem.remove();
                $element.show();
                event.stopPropagation();
            }
        });
        
   	},
    
    renameGroup: function($element, $tmpelem , gid, newname, oldname) {
        if(newname != oldname) {
        $.post(
            OC.generateUrl('/apps/sharing_group/renameGroup'),
            {
                gid: gid,
                newname: newname
            },
            function (result) {
                $element.find('.group-name').text(newname);
                $element.attr('id', newname); 
                $tmpelem.remove();
                $element.show();
                OC.Notification.showTemporary(t(appname, "Renaming sharing_group successfully."));
                GroupList.groups_name.splice(GroupList.groups_name.indexOf(oldname),1);
                GroupList.groups_name.push(newname);
                //GroupList.sortGroups();
            });
        }
        else {
            $tmpelem.remove();
            $element.show();

        }
    },

    getGroupLI: function(gid) {
		return $groupList.find('li.isgroup').filter(function() {
			return GroupList.getElementGID(this) === gid;
		});
	},
    
    getElementGID: function (element) {
		return ($(element).closest('li').data('gid') || '').toString();
	},
    
    addCheckbox: function(id, name){
        var label = $('<label>').attr({for:'id-' + id});
        var checkbox = $('<input>').attr({
            type: 'checkbox', 
            id: 'id-' + id, 
            checked: false
        });
        var span = $('<span>').text(name);
        
        checkbox.tristate();
        checkbox.data({
            'origin': 'unchecked',
            'click': 0
        });
        
        label.append(checkbox);
        label.append(span);
        $('.sg-dropdown-scrollable').append(label);
    },

    addLi: function(gid, name, count, user){
        var li = $('<li>').attr({
            'data-gid': gid , 
            id: name, 
            class: 'isgroup'
        });
        var group = $('<a>')
        var groupname = $('<span>').attr({class: 'group-name'});
        var util = $('<span>').attr({class: 'utils'});
        var usercount = $('<span>').attr({class: 'user-count'});
        var action_delete = $('<a>').attr({
            class: 'icon-delete action delete', 
            original_title: '刪除'
        });
        var action_rename= $('<a>').attr({class: 'icon-rename action rename'});
        
        if (user != null){
            user = user.split(",", count);
            $('#group-list').data(gid, user);
        }
        else {
            $('#group-list').data(gid, []);
        }
        group.append(groupname.text(name));
        util.append(action_rename);
        util.append(action_delete);
        util.append(usercount.text($('#group-list').data(gid).length)) 
        li.append(group);
        li.append(util);

        return li;
    },
    
    showGroupList: function(gids) {
		$.get(
			OC.generateUrl('/apps/sharing_group/getAllGroupsInfo'),
			function(result) {
                if (gids == undefined) {
                    GroupList.initgroup.resolve(result);
                }
                else {
                    $.each(result.data, function(index, group) {
                        $.each(gids, function(index, gid) {
                            if (group.id == gid) {
                                GroupList.groups.push(group.id);

                                $GroupListLi.after(GroupList.addLi(group.id, group.name, group.count, group.user));
                                GroupList.sortGroups();
                            }
                        });
                    });
                }
			}
		);
	},
    
    refreshGroupList: function() {
        $.get(
			OC.generateUrl('/apps/sharing_group/getAllGroupsInfo'),
			function(result) {
			    $.each(result.data, function(index, group) {
                    if(group.user != null) {
                        user = group.user.split(",", group.count);
                        $('#group-list').data(group.id, user);
                    }
                    else {
                        $('#group-list').data(group.id, []);
                    }
                    $('#' + group.name).find('.user-count').text($('#group-list').data(group.id).length); 
                });
			}
		).done(function() {
            $.each($groupList.find('li'),function(index, group) {
                if($(group).hasClass('active') && $(group).data('gid') != '_everyone') {
                    GroupList.showGroup(GroupList.getElementGID(group));
                }
            });
        });

    },
    
    controlGroupUsers: function(multiGroup) {
        $.post(
            OC.generateUrl('/apps/sharing_group/controlGroupUser'),
            {
                multigroup: multiGroup
            },
            function(result) {
                if(result.status == 'success') {
                    GroupList.refreshGroupList();                    
                    OC.Notification.showTemporary(t(appname, "Editing groups successfully."));
                }
            }
            ,'json'
        );
    },
    
    createGroup: function(groupname) {
		$.post(
			OC.generateUrl('/apps/sharing_group/create'),
			{
				name: groupname
			},
			function(result) {
                if (result.status == 'success') {
				    $GroupListLi.after(GroupList.addLi(result.gid, groupname, 0, null));
                    GroupList.groups_name.push(groupname);
                    GroupList.sortGroups();
                }
                else {
				    OC.dialogs.alert(t(appname, 'Group already exists'), t(appname, 'Error create group'));
                }
				GroupList.toggleAddGroup();
		});
	},

    sortGroups: function() {
		var lis = $groupList.find('.isgroup').get();

		lis.sort(function(a, b) {
			// "Everyone" always at the top
			if ($(a).data('gid') === '_everyone') {
				return -1;
			} else if ($(b).data('gid') === '_everyone') {
				return 1;
			}

			if ($sortGroupBy === 1) {
				// Sort by user count first
				var $usersGroupA = $(a).data('user-count');
				var	$usersGroupB = $(b).data('user-count');
				if ($usersGroupA > 0 && $usersGroupA > $usersGroupB) {
					return -1;
				}
				if ($usersGroupB > 0 && $usersGroupB > $usersGroupA) {
					return 1;
				}
			}

			// Fallback or sort by group name
			return UserList.alphanum(
				$(a).find('a span').text(),
				$(b).find('a span').text()
			);
		});

		var items = [];
		$.each(lis, function(index, li) {
			items.push(li);
			if (items.length === 100) {
				$groupList.append(items);
				items = [];
			}
		});
		if (items.length > 0) {
			$groupList.append(items);
		}
	},
    
    deleteGroup: function (gid, groupname) {
        $.post(
	        OC.generateUrl('/apps/sharing_group/deleteGroup'),
			{
				gid: gid
			}, 
            function(result) {
                if (result.status === 'success') {
                    
                    GroupList.showGroup('_everyone');
                    GroupList.groups.splice(GroupList.groups.indexOf(gid),1);
            
                    GroupList.groups_name.splice(GroupList.groups_name.indexOf(groupname),1);

                    OC.Notification.showTemporary(t(appname, 'Deleteing group successfully'));
                }
                else {
                    OC.Notification.showTemporary(t(appname, 'Deleteing group failed'));
                }
            });
    },
};

$(function() {
	$groupList = $('#group-list');
	$GroupListLi = $('#group-list #everyone-group');
	$GroupListLi.after($('<div class="loading" style="height: 200px; visibility: visible;"></div>'));
    GroupList.showGroupList();
    // Display or hide of Create Group List Element
	$('#newgroup-form').hide();
	$('#newgroup-init').on('click', function(e) {
        GroupList.toggleAddGroup(e);
    });
    
    
	$(document).on('click', function(event) {
        if (!GroupList.isAddGroupButtonVisible() &&
			!GroupList.elementBelongsToAddGroup(event.target)) {
			
            $('#newgroup-name').removeClass("ui-status-error");
            GroupList.toggleAddGroup();
		}
	});
    
    $('#newgroup-name').keyup(function(event) {
        var newgroupname = $('#newgroup-name');
        var name = $('#newgroup-name').val();
        
        GroupList.characterFilter($(this), name, 'add'); 
        GroupList.showErrorMsg($(this), event.which);  

        if (!GroupList.isAddGroupButtonVisible() && event.keyCode === $.ui.keyCode.ESCAPE) {
			GroupList.toggleAddGroup();
		}

        if (event.which === $.ui.keyCode.ENTER && GroupList.isGroupNameValid(name) && !newgroupname.hasClass('ui-status-error')) {
            GroupList.createGroup(newgroupname.val());
        }
    });
	
    // Responsible for Creating Groups.
	$('#newgroup-form .button').click(function(event) {
		event.preventDefault();
        var newgroupname = $('#newgroup-name');
        if(GroupList.isGroupNameValid(newgroupname.val()) && !newgroupname.hasClass('ui-status-error')) {
			GroupList.createGroup(newgroupname.val());
        }
        else {
            OC.Notification.showTemporary(t(appname, 'A valid group name must be provided'));
        }
	});

	// click on group name
	$groupList.on('click', 'li.isgroup', function(event) {
        var group = $(this);
        if($(event.target).is('.action.delete')) {
            var id = group.find('a').closest('li').data('gid');
            var groupname = group.find('.group-name').text();
            var dialog = $('<div>').dialog({
                autoOpen: false,
                modal: true,
                title: t(appname, 'Delete Group'),
                buttons: [{
                    text: t(appname,"Yes"),
                    click: function() {
                        GroupList.deleteGroup(id, groupname);
                        $groupList.find('#' + groupname).remove();
                        var deleteGroupname = GroupList.groups.indexOf(groupname);
                        GroupList.groups.splice(deleteGroupname,1);
                        dialog.dialog('close');
                    }
                    },
                    {
                    text: t(appname,"Cancel"),
                    click: function() {
                        dialog.dialog('close');
                    }
                    }],
                close: function() {
                    dialog.remove();
                }
            });
            var p = $('<p>').text( t(appname, "If this group had to share a file or folder, deleting this group will also be canceled share.")+ t(appname, "Are you sure delete group ") + groupname + t(appname, " ?"));
            dialog.append(p);

            dialog.dialog('open');
        } else if ($(event.target).is('.action.rename')) {
            event.stopPropagation();
            GroupList.editGroup(group);
        } else {
            GroupList.showGroup(GroupList.getElementGID(group));
        }

    });
    
    $('.sg-dropdown-menu.group').delegate('input:checkbox', 'change' ,function(event) {
        var checkbox = $(this);
        if(checkbox.data('origin') === 'unchecked' && checkbox.attr('checked') === undefined) {
            checkbox.tristate('state', false);
        }
        if(checkbox.data('origin') === 'checked' && checkbox.attr('checked') === undefined) {
            checkbox.tristate('state', false);
        }
    
        checkbox.data('click',1);
    });

    $('.sg-dropdown-menu.group').click(function(event) {
        event.stopPropagation();
    });
    
    $('#toggle-group').click(function(event) {
        $('.sg-dropdown-scrollable').find('label').remove();
        $.each($groupList.find('li'), function(index, group) {
            if ($(group).data('gid') != null && $(group).data('gid') != '_everyone') {
               GroupList.addCheckbox($(group).data('gid'), group.id)
            }
        });
        
        $.each($('.sg-dropdown-scrollable').find('label input'), function(index, group) {
            UserList.checktristate(group.id); 
        });

    });
    
    $('#multi-group-select').click(function(event) {
        var multiGroup = {};

        $.each($('.sg-dropdown-scrollable').find('label input '), function(index, group) {
            var id = group.id.split('-')[1];
            var checked = $('#' + group.id).attr('checked'); 
            var indeterminate = $('#' + group.id).attr('indeterminate'); 
            var click = $('#' + group.id).data('click');
                 
            var data_add = UserList.compareDifference($('#checkuser').data('checkeduser'),$('#group-list').data(id)); 
            var data_remove = UserList.compareSame(id);
            if (checked !== undefined && click === 1 ) {
                if (data_add.length !== 0) {
                    var action = 'add:' + data_add.join(",");
                    multiGroup[id] = action;
                }
            }
            
            if (checked === undefined && indeterminate === undefined && click === 1) {
                if (data_remove.length !== 0) {
                    var action = 'remove:' + data_remove.join(",");
                    multiGroup[id] = action;
                }
            }
        });
        if (!$.isEmptyObject(multiGroup)){
            GroupList.controlGroupUsers(multiGroup);
        }
        $('.sg-dropdown-menu.group').hide();
        event.stopPropagation();
    });

    $('#cancel').click(function(event) {
        $('.sg-dropdown-menu.group').hide();
        event.stopPropagation();
    });
	
	$('#newgroup-name').on('input', function() {
		GroupList.handleAddGroupInput(this.value);
	});
    
    $('.export').click(function() {
        $.get(
			OC.generateUrl('/apps/sharing_group/export'),
			function (response) {
                if(response.status == 'success')
                OC.Notification.showTemporary(t(appname, "Your friend list already export to filelist"));
		        }
         );
    });
    
    $('.import').click(function() {
        OC.dialogs.filepicker(
            t(appname, "Select the CSV file"),
            function (path) {
                $.ajax({
                    type: "POST",
                    url: OC.generateUrl('/apps/sharing_group/importGroup'),
                    data: { path: path}
                    
                    }).done(function(data) {
                        if(data.status == 'success') {
                            
                            OC.Notification.showTemporary(t(appname, data.msg));
                            UserList.empty();
                            UserList.update(UserList.currentGid);
                            GroupList.showGroupList(data.gids);
                            UserList.countFriends();
                        }
                        else if(data.status == 'error') {
                            OC.Notification.showTemporary(t(appname, data.msg));
                        }
                    });
            },
            false,
            ["text/csv"]
        );
    });
    
});
