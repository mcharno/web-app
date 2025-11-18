<?xml version="1.0" encoding="ISO-8859-1"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

  <xsl:template match="/boxscore">
    <html>
    <head>
    </head>
    <body>
    <h2>Boxscore</h2>
      <table border="1">
        <xsl:choose>
          <xsl:when test="batting/player">
            <tr>
              <th colspan="2">Batting</th>
            </tr>
            <tr>
              <th>Player</th>
              <th>Runs</th>
            </tr>
            <xsl:for-each select="batting/player">
              <xsl:sort select="runs" order="descending" />
              <xsl:apply-templates select="." />
            </xsl:for-each>
          </xsl:when>
        </xsl:choose>
      </table>
      <table border="1">
        <xsl:choose>
          <xsl:when test="bowling/player">
            <tr>
              <th colspan="5">Bowling</th>
            </tr>
            <tr>
              <th>Player</th>
              <th>Overs</th>
              <th>Maidens</th>
              <th>Wickets</th>
              <th>Runs</th>
            </tr>
            <xsl:for-each select="bowling/player">
              <xsl:sort select="wickets" order="descending" />
              <xsl:apply-templates select="." />
            </xsl:for-each>
          </xsl:when>
        </xsl:choose>
      </table>
    </body>
    </html>
  </xsl:template>
        
  <xsl:template match="batting/player">
    <tr>
      <td><xsl:apply-templates select="surname" /></td>
      <td>
        <xsl:apply-templates select="runs" /><xsl:if test="wicket='0'">*</xsl:if>
      </td>
    </tr>
  </xsl:template>
  
  <xsl:template match="bowling/player">
    <tr>
      <td><xsl:apply-templates select="surname" /></td>
      <td><xsl:apply-templates select="overs" /></td>
      <td><xsl:apply-templates select="maidens" /></td>
      <td><xsl:apply-templates select="wickets" /></td>
      <td><xsl:apply-templates select="runs" /></td>
    </tr>
  </xsl:template>
        
</xsl:stylesheet>