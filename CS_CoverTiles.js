/*=============================================================================
 * CityShrimp's Cover Tiles
 * CS_CoverTiles.js
 * Version: 1.0.1
 * Free for commercial and non commercial use.
 *=============================================================================*/

 /*:
 * @plugindesc This plugin provides a way to create "covers".
 *             
 * @author CityShrimp
 *
 * ===Parameter List===
 *
 * @param Cover RegionID
 * @desc This region ID will cause tile to become a cover (passable + higher than events).
 * @default 19
 *
 * @param Block RegionID
 * @desc This region ID will cause tile to become impassible.
 * @default 20
 *
 * @help
 * ============================================================================
 * Latest Version
 * ============================================================================
 * 
 * Get the latest version of this script on 
 * https://github.com/cityshrimp/rmmv/blob/master/CS_CoverTiles.js
 * 
 *=============================================================================
*/

var Imported = Imported || {};
Imported['CS_CoverTiles'] = "1.0.1";

var CS_CoverTiles = CS_CoverTiles || {};

(function($) {
    "use strict";
    
    // Load parameters
    $.parameters = PluginManager.parameters("CS_CoverTiles") || {};
    $._cover_region_id = Number($.parameters['Cover RegionId'] || 19);
    $._block_region_id = Number($.parameters['Block RegionId'] || 20);
    $.tile_flag_set = {};
    
    var old_Game_Map_checkPassage = Game_Map.prototype.checkPassage;
    Game_Map.prototype.checkPassage = function(x, y, bit) {
        var rid = this.regionId(x, y);
        if (rid == $._block_region_id)
            return false;
        if (rid == $._cover_region_id)
            return true;
        return old_Game_Map_checkPassage.call(this, x, y, bit);
    }
    
    ShaderTilemap.prototype._paintTiles = function(startX, startY, x, y) {
        var mx = startX + x;
        var my = startY + y;
        var dx = x * this._tileWidth, dy = y * this._tileHeight;
        var tileId0 = this._readMapData(mx, my, 0);
        var tileId1 = this._readMapData(mx, my, 1);
        var tileId2 = this._readMapData(mx, my, 2);
        var tileId3 = this._readMapData(mx, my, 3);
        var shadowBits = this._readMapData(mx, my, 4);
        var upperTileId1 = this._readMapData(mx, my - 1, 1);
        var lowerLayer = this.lowerLayer.children[0];
        var upperLayer = this.upperLayer.children[0];
        
        var rtileId0 = (0 * $dataMap.height + my) * $dataMap.width + mx;
        var rtileId1 = (1 * $dataMap.height + my) * $dataMap.width + mx;
        var rtileId2 = (2 * $dataMap.height + my) * $dataMap.width + mx;
        var rtileId3 = (3 * $dataMap.height + my) * $dataMap.width + mx;

        if (this._isHigherTile(tileId0)) {
            this._drawTile(upperLayer, tileId0, dx, dy);
        } else {
            this._drawTile(lowerLayer, tileId0, dx, dy);
        }
        if (this._isHigherTile(tileId1)) {
            this._drawTile(upperLayer, tileId1, dx, dy);
        } else {
            this._drawTile(lowerLayer, tileId1, dx, dy);
        }

        this._drawShadow(lowerLayer, shadowBits, dx, dy);
        if (this._isTableTile(upperTileId1) && !this._isTableTile(tileId1)) {
            if (!Tilemap.isShadowingTile(tileId0)) {
                this._drawTableEdge(lowerLayer, upperTileId1, dx, dy);
            }
        }

        if (this._isOverpassPosition(mx, my)) {
            this._drawTile(upperLayer, tileId2, dx, dy);
            this._drawTile(upperLayer, tileId3, dx, dy);
        } else {
            if ($gameMap.regionId(mx, my) == $._cover_region_id) {
                this._drawTile(upperLayer, tileId0, dx, dy);
            } else if (this._isHigherTile(tileId2)) {
                this._drawTile(upperLayer, tileId2, dx, dy);
            } else {
                this._drawTile(lowerLayer, tileId2, dx, dy);
            }
            if (this._isHigherTile(tileId3)) {
                this._drawTile(upperLayer, tileId3, dx, dy);
            } else {
                this._drawTile(lowerLayer, tileId3, dx, dy);
            }
        }
    };
    
    Tilemap.prototype._paintTiles = function(startX, startY, x, y) {
        var tableEdgeVirtualId = 10000;
        var mx = startX + x;
        var my = startY + y;
        var dx = (mx * this._tileWidth).mod(this._layerWidth);
        var dy = (my * this._tileHeight).mod(this._layerHeight);
        var lx = dx / this._tileWidth;
        var ly = dy / this._tileHeight;
        var tileId0 = this._readMapData(mx, my, 0);
        var tileId1 = this._readMapData(mx, my, 1);
        var tileId2 = this._readMapData(mx, my, 2);
        var tileId3 = this._readMapData(mx, my, 3);
        var shadowBits = this._readMapData(mx, my, 4);
        var upperTileId1 = this._readMapData(mx, my - 1, 1);
        var lowerTiles = [];
        var upperTiles = [];

        if (this._isHigherTile(tileId0)) {
            upperTiles.push(tileId0);
        } else {
            lowerTiles.push(tileId0);
        }
        if (this._isHigherTile(tileId1)) {
            upperTiles.push(tileId1);
        } else {
            lowerTiles.push(tileId1);
        }

        lowerTiles.push(-shadowBits);

        if (this._isTableTile(upperTileId1) && !this._isTableTile(tileId1)) {
            if (!Tilemap.isShadowingTile(tileId0)) {
                lowerTiles.push(tableEdgeVirtualId + upperTileId1);
            }
        }

        if (this._isOverpassPosition(mx, my)) {
            upperTiles.push(tileId2);
            upperTiles.push(tileId3);
        } else {
            if ($gameMap.regionId(mx, my) == $._cover_region_id) {
                upperTiles.push(tileId0);
            } else if (this._isHigherTile(tileId2)) {
                upperTiles.push(tileId2);
            } else {
                lowerTiles.push(tileId2);
            }
            if (this._isHigherTile(tileId3)) {
                upperTiles.push(tileId3);
            } else {
                lowerTiles.push(tileId3);
            }
        }

        var lastLowerTiles = this._readLastTiles(0, lx, ly);
        if (!lowerTiles.equals(lastLowerTiles) ||
                (Tilemap.isTileA1(tileId0) && this._frameUpdated)) {
            this._lowerBitmap.clearRect(dx, dy, this._tileWidth, this._tileHeight);
            for (var i = 0; i < lowerTiles.length; i++) {
                var lowerTileId = lowerTiles[i];
                if (lowerTileId < 0) {
                    this._drawShadow(this._lowerBitmap, shadowBits, dx, dy);
                } else if (lowerTileId >= tableEdgeVirtualId) {
                    this._drawTableEdge(this._lowerBitmap, upperTileId1, dx, dy);
                } else {
                    this._drawTile(this._lowerBitmap, lowerTileId, dx, dy);
                }
            }
            this._writeLastTiles(0, lx, ly, lowerTiles);
        }

        var lastUpperTiles = this._readLastTiles(1, lx, ly);
        if (!upperTiles.equals(lastUpperTiles)) {
            this._upperBitmap.clearRect(dx, dy, this._tileWidth, this._tileHeight);
            for (var j = 0; j < upperTiles.length; j++) {
                this._drawTile(this._upperBitmap, upperTiles[j], dx, dy);
            }
            this._writeLastTiles(1, lx, ly, upperTiles);
        }
    };
    
    // ===End Alias Game_Map===
})(CS_CoverTiles);
